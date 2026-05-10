package com.discordmini.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.net.InetSocketAddress;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitFilterTest {

    private RateLimitFilter filter;

    @Mock
    private ReactiveStringRedisTemplate redisTemplate;

    @Mock
    private ReactiveValueOperations<String, String> valueOperations;

    @Mock
    private GatewayFilterChain chain;

    @BeforeEach
    void setUp() throws Exception {
        filter = new RateLimitFilter(redisTemplate);
        
        // Inject maxRequests and windowSeconds using reflection
        var maxRequestsField = RateLimitFilter.class.getDeclaredField("maxRequests");
        maxRequestsField.setAccessible(true);
        maxRequestsField.set(filter, 20);

        var windowSecondsField = RateLimitFilter.class.getDeclaredField("windowSeconds");
        windowSecondsField.setAccessible(true);
        windowSecondsField.set(filter, 10);
    }

    @Test
    void filter_FirstRequest_ShouldSetExpireAndPass() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .header("X-User-Id", "user-123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:api:user-123")).thenReturn(Mono.just(1L));
        when(redisTemplate.expire("rate:api:user-123", Duration.ofSeconds(10))).thenReturn(Mono.just(true));
        when(chain.filter(any())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals("20", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"));
        assertEquals("19", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
        verify(chain, times(1)).filter(exchange);
    }

    @Test
    void filter_UnauthenticatedRequest_ShouldUseIp() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .remoteAddress(new InetSocketAddress("192.168.1.100", 8080))
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:api:192.168.1.100")).thenReturn(Mono.just(5L));
        when(chain.filter(any())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals("20", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Limit"));
        assertEquals("15", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
        verify(redisTemplate, never()).expire(anyString(), any());
        verify(chain, times(1)).filter(exchange);
    }

    @Test
    void filter_ExceedLimit_ShouldReturn429() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .header("X-User-Id", "user-123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:api:user-123")).thenReturn(Mono.just(21L));

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exchange.getResponse().getStatusCode());
        assertEquals("0", exchange.getResponse().getHeaders().getFirst("X-RateLimit-Remaining"));
        verifyNoInteractions(chain);
    }

    @Test
    void filter_RedisError_ShouldFailOpen() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/users")
                .header("X-User-Id", "user-123")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(valueOperations.increment("rate:api:user-123"))
                .thenReturn(Mono.error(new RuntimeException("Redis connection timeout")));
        when(chain.filter(any())).thenReturn(Mono.empty());

        StepVerifier.create(filter.filter(exchange, chain))
                .verifyComplete();

        // Status should be 200 (OK) default because it bypassed the error
        // No rate limit headers should be set because it failed before setting them
        verify(chain, times(1)).filter(exchange);
    }
}
