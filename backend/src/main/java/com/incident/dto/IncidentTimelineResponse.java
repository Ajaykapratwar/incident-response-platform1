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
public class IncidentTimelineResponse {
    private Long id;
    private Incident.IncidentStatus status;
    private String notes;
    private String updatedBy;
    private LocalDateTime createdAt;
}


