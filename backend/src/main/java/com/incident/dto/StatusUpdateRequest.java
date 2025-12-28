package com.incident.dto;

import com.incident.entity.Incident;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {
    @NotNull(message = "Status is required")
    private Incident.IncidentStatus status;

    private String notes;
}


