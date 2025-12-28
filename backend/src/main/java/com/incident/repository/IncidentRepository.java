package com.incident.repository;

import com.incident.entity.Incident;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    Optional<Incident> findByIncidentId(String incidentId);

    @Query(value = """
        SELECT i.*, 
        (6371 * acos(cos(radians(:lat)) * cos(radians(i.latitude)) * 
        cos(radians(i.longitude) - radians(:lon)) + 
        sin(radians(:lat)) * sin(radians(i.latitude)))) AS distance
        FROM incidents i
        WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(i.latitude)) * 
        cos(radians(i.longitude) - radians(:lon)) + 
        sin(radians(:lat)) * sin(radians(i.latitude)))) <= :radius
        AND (:type IS NULL OR i.type = :type)
        AND (:status IS NULL OR i.status = :status)
        AND (:minConfidence IS NULL OR i.confidence_score >= :minConfidence)
        ORDER BY distance ASC, i.created_at DESC
        LIMIT :limit OFFSET :offset
        """, nativeQuery = true)
    List<Incident> findIncidentsWithinRadius(
        @Param("lat") Double latitude,
        @Param("lon") Double longitude,
        @Param("radius") Double radiusKm,
        @Param("type") String type,
        @Param("status") String status,
        @Param("minConfidence") Integer minConfidence,
        @Param("limit") Integer limit,
        @Param("offset") Integer offset
    );

    @Query(value = """
        SELECT i.* FROM incidents i
        WHERE (6371 * acos(cos(radians(:lat)) * cos(radians(i.latitude)) * 
        cos(radians(i.longitude) - radians(:lon)) + 
        sin(radians(:lat)) * sin(radians(i.latitude)))) <= :distanceThreshold
        AND i.type = :type
        AND i.created_at >= :timeWindow
        AND i.status != 'FALSE'
        ORDER BY i.created_at DESC
        """, nativeQuery = true)
    List<Incident> findPotentialDuplicates(
        @Param("lat") Double latitude,
        @Param("lon") Double longitude,
        @Param("distanceThreshold") Double distanceThresholdKm,
        @Param("type") String type,
        @Param("timeWindow") LocalDateTime timeWindow
    );

    Page<Incident> findByStatusOrderByConfidenceScoreDescCreatedAtDesc(
        Incident.IncidentStatus status, Pageable pageable
    );

    @Query("SELECT i FROM Incident i ORDER BY i.confidenceScore DESC, i.createdAt ASC")
    List<Incident> findAllOrderByConfidenceScoreDescCreatedAtAsc();

    @Query("SELECT i FROM Incident i WHERE i.status = :status ORDER BY i.confidenceScore DESC, i.createdAt ASC")
    List<Incident> findByStatusOrderByConfidenceScoreDescCreatedAtAsc(@Param("status") Incident.IncidentStatus status);

    @Query("SELECT COUNT(i) FROM Incident i WHERE i.status = :status")
    Long countByStatus(@Param("status") Incident.IncidentStatus status);

    @Query(value = """
        SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(
            (SELECT MAX(t.created_at) FROM incident_timeline t 
             WHERE t.incident_id = i.id AND t.status = 'RESOLVED'), 
            CURRENT_TIMESTAMP
        ) - i.created_at)) / 3600.0)
        FROM incidents i 
        WHERE i.status IN ('RESOLVED', 'IN_PROGRESS')
        """, nativeQuery = true)
    Double getAverageResponseTimeHours();
}

