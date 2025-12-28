package com.incident.controller;

import com.incident.dto.AuthResponse;
import com.incident.dto.LoginRequest;
import com.incident.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(401)
                .body(java.util.Map.of("error", e.getMessage() != null ? e.getMessage() : "Invalid credentials"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(java.util.Map.of("error", "Internal server error"));
        }
    }
}

