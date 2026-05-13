package com.discordmini.messaging.client;

import com.discordmini.common.exception.BaseException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;

@Slf4j
@Component
public class MembershipClient {

    private final RestClient restClient;
    private final StringRedisTemplate redisTemplate;

    public MembershipClient(RestClient.Builder builder, StringRedisTemplate redisTemplate) {
        // Assume group-channel-service is available via Eureka
        this.restClient = builder.baseUrl("http://group-channel-service").build();
        this.redisTemplate = redisTemplate;
    }

    public void verifyMembership(String userId, String roomId) {
        String cacheKey = "room:members:" + roomId;
        
        // Check cache first
        Boolean isMember = redisTemplate.opsForSet().isMember(cacheKey, userId);
        if (Boolean.TRUE.equals(isMember)) {
            return; // Cache hit and authorized
        }

        // Cache miss or not in cache, verify via group-channel-service
        try {
            restClient.get()
                .uri("/api/rooms/{roomId}/members/{userId}", roomId, userId)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                    throw new BaseException("Not a member of this room", HttpStatus.FORBIDDEN);
                })
                .toBodilessEntity();
                
            // If successful, add to cache with 30m TTL
            // Note: We might want to cache the full list of members instead, 
            // but for verify alone this adds the user.
            redisTemplate.opsForSet().add(cacheKey, userId);
            redisTemplate.expire(cacheKey, Duration.ofMinutes(30));
        } catch (Exception e) {
            log.error("Error verifying membership for user {} in room {}: {}", userId, roomId, e.getMessage());
            throw new BaseException("Not a member of this room", HttpStatus.FORBIDDEN);
        }
    }
}
