package com.discordmini.gateway.config;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.test.StepVerifier;

import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FilterErrorHandlerTest {

    @Test
    void sendError_ShouldReturnJsonFormat() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(FilterErrorHandler.sendError(exchange, HttpStatus.UNAUTHORIZED, "Token expired", "TOKEN_EXPIRED"))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
        
        // MockServerHttpResponse has getBodyAsString() which returns Mono<String>
        String body = ((org.springframework.mock.http.server.reactive.MockServerHttpResponse) exchange.getResponse()).getBodyAsString().block();
        assertTrue(body != null && body.contains("\"success\":false"));
        assertTrue(body != null && body.contains("\"message\":\"Token expired\""));
        assertTrue(body != null && body.contains("\"errorCode\":\"TOKEN_EXPIRED\""));
    }

    @Test
    void sendError_WhenResponseIsCommitted_ShouldReturnEmptyMono() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        // Commit the response
        exchange.getResponse().setComplete().block();

        StepVerifier.create(FilterErrorHandler.sendError(exchange, HttpStatus.UNAUTHORIZED, "Token expired", "TOKEN_EXPIRED"))
                .verifyComplete();
                
        // No body should be written because it's already committed
        // bodyAsByteArray will be empty
    }
}
