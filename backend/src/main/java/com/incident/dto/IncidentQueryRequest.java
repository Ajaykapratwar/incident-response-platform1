package com.incident.dto;

import com.incident.entity.Incident;
import lombok.Data;

@Data
public class IncidentQueryRequest {
    private Double latitude;
    private Double longitude;
    private Double radiusKm; // Search radius in kilometers
    private Incident.IncidentType type;
    private Incident.IncidentStatus status;
    private Integer minConfidenceScore;
    private Integer limit = 50;
    private Integer offset = 0;
}


