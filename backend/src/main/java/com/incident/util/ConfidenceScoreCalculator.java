package com.incident.util;

import com.incident.entity.Incident;
import com.incident.entity.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDateTime;

@Component
public class ConfidenceScoreCalculator {
    @Value("${app.confidence.base-score:30}")
    private int baseScore;

    @Value("${app.confidence.image-bonus:20}")
    private int imageBonus;

    @Value("${app.confidence.confirmation-bonus:15}")
    private int confirmationBonus;

    @Value("${app.confidence.reputation-bonus-max:20}")
    private int reputationBonusMax;

    @Value("${app.confidence.gps-accuracy-bonus-max:15}")
    private int gpsAccuracyBonusMax;

    /**
     * Calculate confidence score (0-100) for an incident
     */
    public int calculate(Incident incident) {
        int score = baseScore;

        // Image bonus
        if (incident.getImageUrl() != null && !incident.getImageUrl().isEmpty()) {
            score += imageBonus;
        }

        // Confirmation bonus (capped at 3 confirmations)
        int confirmations = Math.min(incident.getConfirmationCount(), 3);
        score += confirmations * confirmationBonus;

        // Reputation bonus
        if (incident.getReporter() != null) {
            score += getReputationBonus(incident.getReporter().getReputation());
        }

        // GPS accuracy bonus (better accuracy = higher score)
        if (incident.getGpsAccuracy() != null) {
            score += getGpsAccuracyBonus(incident.getGpsAccuracy());
        }

        // Time freshness bonus (recent reports get slight boost)
        score += getTimeFreshnessBonus(incident.getCreatedAt());

        // Cap at 100
        return Math.min(100, score);
    }

    private int getReputationBonus(User.ReputationLevel reputation) {
        return switch (reputation) {
            case NEW -> 0;
            case RELIABLE -> reputationBonusMax / 2;
            case TRUSTED -> reputationBonusMax;
        };
    }

    private int getGpsAccuracyBonus(Double accuracyMeters) {
        if (accuracyMeters == null) return 0;
        // Better accuracy (lower meters) = higher bonus
        // 0-10m = max bonus, 10-50m = medium, 50+ = low
        if (accuracyMeters <= 10) {
            return gpsAccuracyBonusMax;
        } else if (accuracyMeters <= 50) {
            return gpsAccuracyBonusMax / 2;
        } else {
            return gpsAccuracyBonusMax / 4;
        }
    }

    private int getTimeFreshnessBonus(LocalDateTime createdAt) {
        if (createdAt == null) return 0;
        long hoursAgo = Duration.between(createdAt, LocalDateTime.now()).toHours();
        // Reports within last hour get +5 bonus
        if (hoursAgo <= 1) return 5;
        // Reports within last 6 hours get +2 bonus
        if (hoursAgo <= 6) return 2;
        return 0;
    }

    public String getConfidenceLevel(int score) {
        if (score >= 70) return "HIGH";
        if (score >= 40) return "MEDIUM";
        return "LOW";
    }
}


