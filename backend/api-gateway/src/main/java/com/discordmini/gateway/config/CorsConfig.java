package com.discordmini.gateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String[] allowedOrigins;

    @Value("${app.cors.allowed-origin-patterns:}")
    private String[] allowedOriginPatterns;

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        
        // Allowed origins
        if (allowedOrigins != null && allowedOrigins.length > 0 && !allowedOrigins[0].isEmpty()) {
            corsConfig.setAllowedOrigins(List.of(allowedOrigins));
        }

        // Allowed origin patterns (for Vercel preview environments)
        if (allowedOriginPatterns != null && allowedOriginPatterns.length > 0 && !allowedOriginPatterns[0].isEmpty()) {
            corsConfig.setAllowedOriginPatterns(List.of(allowedOriginPatterns));
        }
        
        // Allowed methods
        corsConfig.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        
        // Allowed headers
        corsConfig.setAllowedHeaders(List.of("*"));
        
        // Expose headers if needed by frontend (e.g., for pagination or rate limit)
        corsConfig.setExposedHeaders(List.of("X-RateLimit-Remaining", "X-RateLimit-Limit", "X-RateLimit-Reset"));
        
        // Allow credentials (cookies, authorization headers)
        corsConfig.setAllowCredentials(true);
        
        // Cache preflight request for 1 hour
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfig);

        return new CorsWebFilter(source);
    }
}
