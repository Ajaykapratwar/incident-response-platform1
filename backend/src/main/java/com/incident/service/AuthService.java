package com.incident.service;

import com.incident.dto.AuthResponse;
import com.incident.dto.LoginRequest;
import com.incident.entity.User;
import com.incident.repository.UserRepository;
import com.incident.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid username or password"));

        if (user.getPassword() == null || user.getPassword().isEmpty() || user.getPassword().equals("N/A")) {
            throw new RuntimeException("User account not properly configured");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        if (!user.getActive()) {
            throw new RuntimeException("Account is disabled");
        }

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
            .token(token)
            .username(user.getUsername())
            .role(user.getRole())
            .build();
    }
}

