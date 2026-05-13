package com.discordmini.messaging.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimiter {

    private final StringRedisTemplate redisTemplate;
    private static final int MAX_MESSAGES_PER_SECOND = 5;

    public boolean isAllowed(String userId) {
        String key = "rate:msg:" + userId;
        Long count = redisTemplate.opsForValue().increment(key);
        if (count != null && count == 1) {
            redisTemplate.expire(key, Duration.ofSeconds(1));
        }
        return count != null && count <= MAX_MESSAGES_PER_SECOND;
    }
}
