package com.incident.dto;

import com.incident.entity.Incident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IncidentResponse {
    private Long id;
    private String incidentId;
    private Incident.IncidentType type;
    private String description;
    private Double latitude;
    private Double longitude;
    private String address;
    private Double gpsAccuracy;
    private String imageUrl;
    private Incident.IncidentStatus status;
    private Integer confidenceScore;
    private Integer confirmationCount;
    private String reporterUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double distanceKm; // Distance from query point
    private String adminNotes; // Only visible to ADMIN/RESPONDER
    private List<IncidentResponse> potentialDuplicates; // For duplicate detection
}

