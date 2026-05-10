package com.discordmini.gateway.filter;

import com.discordmini.gateway.config.FilterErrorHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

@Component
public class RateLimitFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private final ReactiveStringRedisTemplate redisTemplate;

    @Value("${gateway.rate-limit.max-requests:20}")
    private int maxRequests;

    @Value("${gateway.rate-limit.window-seconds:10}")
    private int windowSeconds;

    public RateLimitFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String identifier = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        
        if (identifier == null || identifier.isEmpty()) {
            // Fallback to IP address if unauthenticated
            identifier = exchange.getRequest().getRemoteAddress() != null 
                    ? exchange.getRequest().getRemoteAddress().getAddress().getHostAddress() 
                    : "unknown";
        }

        String key = "rate:api:" + identifier;

        return redisTemplate.opsForValue().increment(key)
                .flatMap(count -> {
                    if (count == 1) {
                        return redisTemplate.expire(key, Duration.ofSeconds(windowSeconds))
                                .thenReturn(count);
                    }
                    return Mono.just(count);
                })
                .flatMap(count -> {
                    exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(maxRequests));
                    exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(Math.max(0, maxRequests - count)));
                    
                    if (count > maxRequests) {
                        return FilterErrorHandler.sendError(
                                exchange, 
                                HttpStatus.TOO_MANY_REQUESTS, 
                                "Rate limit exceeded. Please try again later.", 
                                "RATE_LIMIT_EXCEEDED"
                        );
                    }
                    return chain.filter(exchange);
                })
                // FAIL-OPEN FALLBACK
                .onErrorResume(throwable -> {
                    log.warn("Redis rate limit unavailable, fail-open applied for key {}: {}", key, throwable.getMessage());
                    // Allow the request to pass through if Redis is down or timed out
                    return chain.filter(exchange);
                });
    }

    @Override
    public int getOrder() {
        return -90; // Run after JwtAuthFilter (-100)
    }
}
