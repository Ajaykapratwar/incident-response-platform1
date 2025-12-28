package com.incident.dto;

import com.incident.entity.Incident;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentIncident {
    private String incidentId;
    private Incident.IncidentType type;
    private Incident.IncidentStatus status;
    private Integer confidenceScore;
    private LocalDateTime createdAt;
}


