package com.incident.repository;

import com.incident.entity.Confirmation;
import com.incident.entity.Incident;
import com.incident.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ConfirmationRepository extends JpaRepository<Confirmation, Long> {
    Optional<Confirmation> findByIncidentAndUser(Incident incident, User user);
    Long countByIncident(Incident incident);
}


