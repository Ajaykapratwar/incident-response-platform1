package com.incident.controller;

import com.incident.dto.*;
import com.incident.service.FileStorageService;
import com.incident.service.IncidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {
    private final IncidentService incidentService;
    private final FileStorageService fileStorageService;

    @PostMapping("/public/report")
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @ModelAttribute IncidentCreateRequest request,
            @RequestParam(required = false) MultipartFile image,
            @RequestParam(required = false, defaultValue = "anonymous") String reporterUsername) {
        try {
            String imageUrl = null;
            if (image != null && !image.isEmpty()) {
                imageUrl = fileStorageService.storeFile(image);
            }

            IncidentResponse response = incidentService.createIncident(request, imageUrl, reporterUsername);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/public/query")
    public ResponseEntity<List<IncidentResponse>> queryIncidents(@ModelAttribute IncidentQueryRequest request) {
        List<IncidentResponse> incidents = incidentService.queryIncidents(request);
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/public/{incidentId}")
    public ResponseEntity<IncidentResponse> getIncidentByIncidentId(@PathVariable String incidentId) {
        IncidentResponse incident = incidentService.getIncidentByIncidentId(incidentId);
        return ResponseEntity.ok(incident);
    }

    @PostMapping("/public/confirm")
    public ResponseEntity<IncidentResponse> confirmIncident(
            @Valid @RequestBody ConfirmationRequest request,
            @RequestParam(required = false, defaultValue = "anonymous") String username) {
        IncidentResponse response = incidentService.confirmIncident(
            request.getIncidentId(), request.getLatitude(), request.getLongitude(), username
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/incidents")
    public ResponseEntity<List<IncidentResponse>> getAllIncidents(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        List<IncidentResponse> incidents = incidentService.getAllIncidentsForAdmin(status);
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/admin/prioritized")
    public ResponseEntity<List<IncidentResponse>> getPrioritizedIncidents(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "50") int limit,
            Authentication authentication) {
        List<IncidentResponse> incidents = incidentService.getPrioritizedIncidents(status, limit);
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/admin/{id}")
    public ResponseEntity<IncidentResponse> getIncidentById(@PathVariable Long id) {
        IncidentResponse incident = incidentService.getIncidentById(id);
        return ResponseEntity.ok(incident);
    }

    @GetMapping("/admin/{id}/timeline")
    public ResponseEntity<List<IncidentTimelineResponse>> getIncidentTimeline(@PathVariable Long id) {
        List<IncidentTimelineResponse> timeline = incidentService.getIncidentTimeline(id);
        return ResponseEntity.ok(timeline);
    }

    @PutMapping("/admin/{id}/status")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            Authentication authentication) {
        IncidentResponse response = incidentService.updateStatus(
            id, request.getStatus(), request.getNotes(), authentication.getName()
        );
        return ResponseEntity.ok(response);
    }
}

