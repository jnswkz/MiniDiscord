package com.discordmini.messaging.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimiterTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private RateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void isAllowed_FirstMessage_ReturnsTrueAndSetsExpire() {
        String userId = "user1";
        String key = "rate:msg:" + userId;
        
        when(valueOperations.increment(key)).thenReturn(1L);

        boolean result = rateLimiter.isAllowed(userId);

        assertTrue(result);
        verify(redisTemplate, times(1)).expire(eq(key), any(Duration.class));
    }

    @Test
    void isAllowed_UnderLimit_ReturnsTrue() {
        String userId = "user1";
        String key = "rate:msg:" + userId;
        
        when(valueOperations.increment(key)).thenReturn(3L);

        boolean result = rateLimiter.isAllowed(userId);

        assertTrue(result);
        verify(redisTemplate, never()).expire(anyString(), any(Duration.class));
    }

    @Test
    void isAllowed_OverLimit_ReturnsFalse() {
        String userId = "user1";
        String key = "rate:msg:" + userId;
        
        when(valueOperations.increment(key)).thenReturn(6L);

        boolean result = rateLimiter.isAllowed(userId);

        assertFalse(result);
        verify(redisTemplate, never()).expire(anyString(), any(Duration.class));
    }
}
