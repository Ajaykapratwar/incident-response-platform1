package com.incident.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalIncidents;
    private Long verifiedIncidents;
    private Long resolvedIncidents;
    private Double accuracyRate; // verified / total
    private Double averageResponseTimeHours;
    private List<RecentIncident> recentIncidents;
}


