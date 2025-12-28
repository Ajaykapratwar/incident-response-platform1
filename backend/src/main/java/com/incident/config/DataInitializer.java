package com.incident.config;

import com.incident.entity.Incident;
import com.incident.entity.IncidentTimeline;
import com.incident.entity.User;
import com.incident.repository.IncidentRepository;
import com.incident.repository.IncidentTimelineRepository;
import com.incident.repository.UserRepository;
import com.incident.util.IncidentIdGenerator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private final UserRepository userRepository;
    private final IncidentRepository incidentRepository;
    private final IncidentTimelineRepository timelineRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Create default admin user if not exists
        User adminUser = null;
        if (!userRepository.existsByUsername("admin")) {
            adminUser = User.builder()
                .username("admin")
                .email("admin@incident.local")
                .password(passwordEncoder.encode("admin123"))
                .role(User.Role.ADMIN)
                .reputation(User.ReputationLevel.TRUSTED)
                .active(true)
                .build();
            adminUser = userRepository.save(adminUser);
            log.info("Created default admin user: admin/admin123");
        } else {
            adminUser = userRepository.findByUsername("admin").orElse(null);
            log.info("Admin user already exists");
        }

        // Create default responder user if not exists
        if (!userRepository.existsByUsername("responder")) {
            User responder = User.builder()
                .username("responder")
                .email("responder@incident.local")
                .password(passwordEncoder.encode("responder123"))
                .role(User.Role.RESPONDER)
                .reputation(User.ReputationLevel.TRUSTED)
                .active(true)
                .build();
            userRepository.save(responder);
            log.info("Created default responder user: responder/responder123");
        } else {
            log.info("Responder user already exists");
        }

        // Seed sample incidents if database is empty (for demo)
        if (incidentRepository.count() == 0 && adminUser != null) {
            log.info("Database is empty, seeding sample incidents for demo...");
            seedSampleIncidents(adminUser);
        }
    }

    private void seedSampleIncidents(User adminUser) {
        // Sample incident 1 - High priority
        Incident incident1 = Incident.builder()
            .incidentId(IncidentIdGenerator.generate())
            .type(Incident.IncidentType.MEDICAL)
            .description("Medical emergency reported at downtown intersection. Person appears to need immediate assistance.")
            .latitude(40.7128)
            .longitude(-74.0060)
            .address("123 Main Street, Downtown")
            .gpsAccuracy(15.0)
            .status(Incident.IncidentStatus.UNVERIFIED)
            .confidenceScore(75)
            .confirmationCount(2)
            .reporter(adminUser)
            .build();
        incident1 = incidentRepository.save(incident1);
        timelineRepository.save(IncidentTimeline.builder()
            .incident(incident1)
            .status(Incident.IncidentStatus.UNVERIFIED)
            .notes("Incident reported")
            .build());

        // Sample incident 2 - Medium priority
        Incident incident2 = Incident.builder()
            .incidentId(IncidentIdGenerator.generate())
            .type(Incident.IncidentType.ACCIDENT)
            .description("Car accident on highway. Two vehicles involved, no visible injuries.")
            .latitude(40.7580)
            .longitude(-73.9855)
            .address("Highway 101, Mile Marker 45")
            .gpsAccuracy(25.0)
            .status(Incident.IncidentStatus.VERIFIED)
            .confidenceScore(60)
            .confirmationCount(1)
            .reporter(adminUser)
            .build();
        incident2 = incidentRepository.save(incident2);
        timelineRepository.save(IncidentTimeline.builder()
            .incident(incident2)
            .status(Incident.IncidentStatus.UNVERIFIED)
            .notes("Incident reported")
            .build());
        timelineRepository.save(IncidentTimeline.builder()
            .incident(incident2)
            .status(Incident.IncidentStatus.VERIFIED)
            .notes("Verified by responder on scene")
            .updatedBy(adminUser)
            .build());

        // Sample incident 3 - Low priority
        Incident incident3 = Incident.builder()
            .incidentId(IncidentIdGenerator.generate())
            .type(Incident.IncidentType.INFRASTRUCTURE)
            .description("Pothole reported on residential street. Moderate size.")
            .latitude(40.7505)
            .longitude(-73.9934)
            .address("Oak Avenue, between 5th and 6th Street")
            .gpsAccuracy(30.0)
            .status(Incident.IncidentStatus.IN_PROGRESS)
            .confidenceScore(45)
            .confirmationCount(0)
            .reporter(adminUser)
            .build();
        incident3 = incidentRepository.save(incident3);
        timelineRepository.save(IncidentTimeline.builder()
            .incident(incident3)
            .status(Incident.IncidentStatus.UNVERIFIED)
            .notes("Incident reported")
            .build());
        timelineRepository.save(IncidentTimeline.builder()
            .incident(incident3)
            .status(Incident.IncidentStatus.VERIFIED)
            .notes("Verified")
            .updatedBy(adminUser)
            .build());
        timelineRepository.save(IncidentTimeline.builder()
            .incident(incident3)
            .status(Incident.IncidentStatus.IN_PROGRESS)
            .notes("Maintenance crew dispatched")
            .updatedBy(adminUser)
            .build());

        log.info("Seeded {} sample incidents", 3);
    }
}

