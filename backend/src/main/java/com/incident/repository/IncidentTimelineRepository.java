package com.incident.repository;

import com.incident.entity.Incident;
import com.incident.entity.IncidentTimeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentTimelineRepository extends JpaRepository<IncidentTimeline, Long> {
    List<IncidentTimeline> findByIncidentOrderByCreatedAtAsc(Incident incident);
}


