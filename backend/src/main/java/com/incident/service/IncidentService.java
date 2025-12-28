package com.incident.service;

import com.incident.dto.*;
import com.incident.entity.*;
import com.incident.repository.ConfirmationRepository;
import com.incident.repository.IncidentRepository;
import com.incident.repository.IncidentTimelineRepository;
import com.incident.repository.UserRepository;
import com.incident.util.ConfidenceScoreCalculator;
import com.incident.util.IncidentIdGenerator;
import com.incident.util.LocationUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class IncidentService {
    private final IncidentRepository incidentRepository;
    private final UserRepository userRepository;
    private final ConfirmationRepository confirmationRepository;
    private final IncidentTimelineRepository timelineRepository;
    private final ConfidenceScoreCalculator confidenceCalculator;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${app.duplicate.distance-threshold-meters:300}")
    private double duplicateDistanceThresholdMeters;

    @Value("${app.duplicate.time-window-minutes:10}")
    private int duplicateTimeWindowMinutes;

    @Transactional
    public IncidentResponse createIncident(IncidentCreateRequest request, String imageUrl, String reporterUsername) {
        // Check for duplicates
        List<Incident> potentialDuplicates = findPotentialDuplicates(
            request.getLatitude(), request.getLongitude(), request.getType()
        );

        Incident incident = Incident.builder()
            .incidentId(IncidentIdGenerator.generate())
            .type(request.getType())
            .description(request.getDescription())
            .latitude(request.getLatitude())
            .longitude(request.getLongitude())
            .address(request.getAddress())
            .gpsAccuracy(request.getGpsAccuracy())
            .imageUrl(imageUrl)
            .status(Incident.IncidentStatus.UNVERIFIED)
            .reporter(getOrCreatePublicUser(reporterUsername))
            .build();

        incident.setConfidenceScore(confidenceCalculator.calculate(incident));
        incident = incidentRepository.save(incident);

        // Create initial timeline entry
        IncidentTimeline timeline = IncidentTimeline.builder()
            .incident(incident)
            .status(Incident.IncidentStatus.UNVERIFIED)
            .notes("Incident reported")
            .build();
        timelineRepository.save(timeline);

        // Broadcast via WebSocket
        broadcastIncidentUpdate(incident);

        IncidentResponse response = toResponse(incident);
        response.setPotentialDuplicates(potentialDuplicates.stream()
            .map(this::toResponse)
            .collect(Collectors.toList()));
        
        return response;
    }

    public List<Incident> findPotentialDuplicates(Double latitude, Double longitude, Incident.IncidentType type) {
        double thresholdKm = LocationUtil.metersToKm(duplicateDistanceThresholdMeters);
        LocalDateTime timeWindow = LocalDateTime.now().minusMinutes(duplicateTimeWindowMinutes);
        
        return incidentRepository.findPotentialDuplicates(
            latitude, longitude, thresholdKm, type.name(), timeWindow
        );
    }

    @Transactional
    public IncidentResponse confirmIncident(Long incidentId, Double latitude, Double longitude, String username) {
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        User user = getOrCreatePublicUser(username);

        // Check if already confirmed
        if (confirmationRepository.findByIncidentAndUser(incident, user).isPresent()) {
            throw new RuntimeException("Already confirmed this incident");
        }

        Confirmation confirmation = Confirmation.builder()
            .incident(incident)
            .user(user)
            .latitude(latitude)
            .longitude(longitude)
            .build();
        confirmationRepository.save(confirmation);

        // Update confirmation count and recalculate confidence
        incident.setConfirmationCount(incident.getConfirmationCount() + 1);
        incident.setConfidenceScore(confidenceCalculator.calculate(incident));
        incident = incidentRepository.save(incident);

        broadcastIncidentUpdate(incident);
        return toResponse(incident);
    }

    @Transactional
    public IncidentResponse updateStatus(Long incidentId, Incident.IncidentStatus status, String notes, String updatedByUsername) {
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));

        User updatedBy = userRepository.findByUsername(updatedByUsername)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Role-based restrictions: Only ADMIN can verify or mark as FALSE
        if (status == Incident.IncidentStatus.VERIFIED || status == Incident.IncidentStatus.FALSE) {
            if (updatedBy.getRole() != User.Role.ADMIN) {
                throw new RuntimeException("Only administrators can verify or mark incidents as false");
            }
        }

        incident.setStatus(status);
        if (notes != null && !notes.isEmpty()) {
            incident.setAdminNotes(notes);
        }

        // Update reporter reputation if status changed to VERIFIED or FALSE
        if (status == Incident.IncidentStatus.VERIFIED && incident.getReporter() != null) {
            updateReporterReputation(incident.getReporter(), true);
        } else if (status == Incident.IncidentStatus.FALSE && incident.getReporter() != null) {
            updateReporterReputation(incident.getReporter(), false);
        }

        incident = incidentRepository.save(incident);

        // Create timeline entry
        IncidentTimeline timeline = IncidentTimeline.builder()
            .incident(incident)
            .status(status)
            .notes(notes)
            .updatedBy(updatedBy)
            .build();
        timelineRepository.save(timeline);

        broadcastIncidentUpdate(incident);
        return toResponse(incident);
    }

    private void updateReporterReputation(User reporter, boolean verified) {
        if (verified) {
            reporter.setVerifiedReports(reporter.getVerifiedReports() + 1);
            // Promote to RELIABLE after 3 verified reports
            if (reporter.getVerifiedReports() >= 3 && reporter.getReputation() == User.ReputationLevel.NEW) {
                reporter.setReputation(User.ReputationLevel.RELIABLE);
            }
            // Promote to TRUSTED after 10 verified reports
            if (reporter.getVerifiedReports() >= 10 && reporter.getReputation() == User.ReputationLevel.RELIABLE) {
                reporter.setReputation(User.ReputationLevel.TRUSTED);
            }
        } else {
            reporter.setFalseReports(reporter.getFalseReports() + 1);
            // Demote if too many false reports
            if (reporter.getFalseReports() >= 3) {
                reporter.setReputation(User.ReputationLevel.NEW);
            }
        }
        userRepository.save(reporter);
    }

    public List<IncidentResponse> queryIncidents(IncidentQueryRequest request) {
        List<Incident> incidents;
        
        if (request.getLatitude() != null && request.getLongitude() != null && request.getRadiusKm() != null) {
            incidents = incidentRepository.findIncidentsWithinRadius(
                request.getLatitude(),
                request.getLongitude(),
                request.getRadiusKm(),
                request.getType() != null ? request.getType().name() : null,
                request.getStatus() != null ? request.getStatus().name() : null,
                request.getMinConfidenceScore(),
                request.getLimit(),
                request.getOffset()
            );
        } else {
            Pageable pageable = PageRequest.of(request.getOffset() / request.getLimit(), request.getLimit());
            Page<Incident> page = incidentRepository.findAll(pageable);
            incidents = page.getContent();
        }

        return incidents.stream()
            .map(incident -> {
                IncidentResponse response = toResponse(incident);
                if (request.getLatitude() != null && request.getLongitude() != null) {
                    double distance = LocationUtil.calculateDistance(
                        request.getLatitude(), request.getLongitude(),
                        incident.getLatitude(), incident.getLongitude()
                    );
                    response.setDistanceKm(distance);
                }
                return response;
            })
            .collect(Collectors.toList());
    }

    public IncidentResponse getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        return toResponse(incident);
    }

    public IncidentResponse getIncidentByIncidentId(String incidentId) {
        Incident incident = incidentRepository.findByIncidentId(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        return toResponse(incident);
    }

    public List<IncidentResponse> getAllIncidentsForAdmin(String status) {
        List<Incident> incidents;
        
        if (status != null && !status.isEmpty()) {
            Incident.IncidentStatus incidentStatus = Incident.IncidentStatus.valueOf(status);
            incidents = incidentRepository.findByStatusOrderByConfidenceScoreDescCreatedAtAsc(incidentStatus);
        } else {
            incidents = incidentRepository.findAllOrderByConfidenceScoreDescCreatedAtAsc();
        }

        return incidents.stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    public List<IncidentResponse> getPrioritizedIncidents(String status, int limit) {
        List<IncidentResponse> allIncidents = getAllIncidentsForAdmin(status);
        return allIncidents.stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<IncidentTimelineResponse> getIncidentTimeline(Long incidentId) {
        Incident incident = incidentRepository.findById(incidentId)
            .orElseThrow(() -> new RuntimeException("Incident not found"));
        
        List<IncidentTimeline> timeline = timelineRepository.findByIncidentOrderByCreatedAtAsc(incident);
        
        return timeline.stream()
            .map(t -> IncidentTimelineResponse.builder()
                .id(t.getId())
                .status(t.getStatus())
                .notes(t.getNotes())
                .updatedBy(t.getUpdatedBy() != null ? t.getUpdatedBy().getUsername() : null)
                .createdAt(t.getCreatedAt())
                .build())
            .collect(Collectors.toList());
    }

    public DashboardStatsResponse getDashboardStats() {
        long total = incidentRepository.count();
        long verified = incidentRepository.countByStatus(Incident.IncidentStatus.VERIFIED);
        long resolved = incidentRepository.countByStatus(Incident.IncidentStatus.RESOLVED);
        
        double accuracyRate = total > 0 ? (double) verified / total * 100 : 0.0;
        Double avgResponseTime = incidentRepository.getAverageResponseTimeHours();
        
        List<RecentIncident> recent = incidentRepository.findAll()
            .stream()
            .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
            .limit(10)
            .map(i -> RecentIncident.builder()
                .incidentId(i.getIncidentId())
                .type(i.getType())
                .status(i.getStatus())
                .confidenceScore(i.getConfidenceScore())
                .createdAt(i.getCreatedAt())
                .build())
            .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
            .totalIncidents(total)
            .verifiedIncidents(verified)
            .resolvedIncidents(resolved)
            .accuracyRate(accuracyRate)
            .averageResponseTimeHours(avgResponseTime != null ? avgResponseTime : 0.0)
            .recentIncidents(recent)
            .build();
    }

    private User getOrCreatePublicUser(String username) {
        return userRepository.findByUsername(username)
            .orElseGet(() -> {
                User user = User.builder()
                    .username(username)
                    .email(username + "@anonymous.local")
                    .password("N/A") // Public users don't have passwords
                    .role(User.Role.PUBLIC)
                    .reputation(User.ReputationLevel.NEW)
                    .build();
                return userRepository.save(user);
            });
    }

    private IncidentResponse toResponse(Incident incident) {
        IncidentResponse response = IncidentResponse.builder()
            .id(incident.getId())
            .incidentId(incident.getIncidentId())
            .type(incident.getType())
            .description(incident.getDescription())
            .latitude(incident.getLatitude())
            .longitude(incident.getLongitude())
            .address(incident.getAddress())
            .gpsAccuracy(incident.getGpsAccuracy())
            .imageUrl(incident.getImageUrl())
            .status(incident.getStatus())
            .confidenceScore(incident.getConfidenceScore())
            .confirmationCount(incident.getConfirmationCount())
            .reporterUsername(incident.getReporter() != null ? incident.getReporter().getUsername() : null)
            .adminNotes(incident.getAdminNotes())
            .createdAt(incident.getCreatedAt())
            .updatedAt(incident.getUpdatedAt())
            .build();
        return response;
    }

    private void broadcastIncidentUpdate(Incident incident) {
        IncidentResponse response = toResponse(incident);
        messagingTemplate.convertAndSend("/topic/incidents", response);
    }
}