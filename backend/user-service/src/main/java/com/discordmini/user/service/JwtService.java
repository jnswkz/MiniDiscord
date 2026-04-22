package com.discordmini.user.service;

import com.discordmini.common.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class JwtService {

    private final JwtUtil jwtUtil;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expirationMs) {
        this.jwtUtil = new JwtUtil(secret, expirationMs);
    }

    public String generateToken(String userId, String email, String role) {
        return jwtUtil.generateToken(userId, Map.of(
                "email", email,
                "role", role
        ));
    }

    public String extractUserId(String token) {
        return jwtUtil.extractSubject(token);
    }

    public boolean isTokenValid(String token, String userId) {
        return jwtUtil.isTokenValid(token, userId);
    }
}
