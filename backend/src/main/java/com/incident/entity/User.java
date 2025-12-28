package com.incident.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String username;

    @Column(nullable = false, length = 255)
    private String password; // BCrypt hashed

    @Column(nullable = false, length = 100)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.PUBLIC;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ReputationLevel reputation = ReputationLevel.NEW;

    @Column(nullable = false)
    @Builder.Default
    private Integer verifiedReports = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer falseReports = 0;

    @OneToMany(mappedBy = "reporter", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Incident> reportedIncidents = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Confirmation> confirmations = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    public enum Role {
        PUBLIC, RESPONDER, ADMIN
    }

    public enum ReputationLevel {
        NEW(0), RELIABLE(50), TRUSTED(100);

        private final int score;

        ReputationLevel(int score) {
            this.score = score;
        }

        public int getScore() {
            return score;
        }
    }
}


