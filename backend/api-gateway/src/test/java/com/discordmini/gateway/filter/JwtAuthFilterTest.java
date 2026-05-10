package com.discordmini.gateway.filter;

import com.discordmini.common.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

    private JwtAuthFilter filter;

    @Mock
    private GatewayFilterChain chain;

    @Mock
    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() throws Exception {
        filter = new JwtAuthFilter("ZHVtbXktc2VjcmV0LWtleS10aGF0LWlzLWxvbmctZW5vdWdoLWZvci1oczI1Ng==");
        
        // Use reflection to inject the mock JwtUtil
        Field jwtUtilField = JwtAuthFilter.class.getDeclaredField("jwtUtil");
        jwtUtilField.setAccessible(true);
        jwtUtilField.set(filter, jwtUtil);
    }

    @Test
    void filter_OpenPath_ShouldBypass() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/auth/login").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(chain.filter(exchange)).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        verify(chain, times(1)).filter(exchange);
        verifyNoInteractions(jwtUtil);
    }

    @Test
    void filter_MissingAuthorizationHeader_ShouldReturn401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/me").build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete(); // FilterErrorHandler writes response and returns empty

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verifyNoInteractions(chain);
    }

    @Test
    void filter_InvalidAuthorizationHeader_ShouldReturn401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Basic abc")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verifyNoInteractions(chain);
    }

    @Test
    void filter_ExpiredToken_ShouldReturn401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer expired-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.isTokenExpired("expired-token")).thenReturn(true);

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verifyNoInteractions(chain);
    }

    @Test
    void filter_ValidToken_ShouldPassAndInjectHeader() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.isTokenExpired("valid-token")).thenReturn(false);
        when(jwtUtil.extractSubject("valid-token")).thenReturn("user-123");
        when(chain.filter(any())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        ArgumentCaptor<ServerWebExchange> exchangeCaptor = ArgumentCaptor.forClass(ServerWebExchange.class);
        verify(chain).filter(exchangeCaptor.capture());

        ServerWebExchange mutatedExchange = exchangeCaptor.getValue();
        assertEquals("user-123", mutatedExchange.getRequest().getHeaders().getFirst("X-User-Id"));
    }

    @Test
    void filter_ExceptionDuringValidation_ShouldReturn401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer bad-token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.isTokenExpired("bad-token")).thenThrow(new RuntimeException("Bad JWT signature"));

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verifyNoInteractions(chain);
    }
}
