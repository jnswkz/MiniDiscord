package com.discordmini.messaging.config;

import com.discordmini.common.security.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JwtConfig {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Bean
    public JwtUtil jwtUtil() {
        // Expiration is not strictly needed for validation if we only rely on extractSubject catching expired exceptions
        // but we can provide a default.
        return new JwtUtil(jwtSecret, 86400000L); // 24 hours
    }
}
