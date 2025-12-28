package com.incident.controller;

import com.incident.dto.AuthResponse;
import com.incident.dto.LoginRequest;
import com.incident.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {"https://resqnow-three.vercel.app", "http://localhost:5173", "http://localhost:3000"}, allowCredentials = "true")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login attempt for username: {}", request.getUsername());
        try {
            AuthResponse response = authService.login(request);
            log.info("Login successful for username: {}", request.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Login failed for username: {} - {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(401)
                .body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Invalid credentials"));
        } catch (Exception e) {
            log.error("Unexpected error during login for username: {}", request.getUsername(), e);
            return ResponseEntity.status(500)
                .body(java.util.Map.of("error", "Internal server error"));
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(java.util.Map.of("status", "ok", "service", "auth"));
    }
}

