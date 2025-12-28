package com.incident.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConfirmationRequest {
    @NotNull(message = "Incident ID is required")
    private Long incidentId;

    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
}


