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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ConnectionManager connectionManager;
    
    @Mock
    private RedisPubSubService redisPubSubService;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private PresenceService presenceService;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void setUserOnline_SetsRedisKey() {
        String userId = "user1";
        
        presenceService.setUserOnline(userId);
        
        verify(valueOperations, times(1)).set(eq("presence:user1"), eq("ONLINE"), any(Duration.class));
    }

    @Test
    void setUserOffline_DeletesRedisKey() {
        String userId = "user1";
        
        presenceService.setUserOffline(userId);
        
        verify(redisTemplate, times(1)).delete("presence:user1");
    }

    @Test
    void cleanZombieSessions_RefreshesConnections() {
        presenceService.cleanZombieSessions();
        
        verify(connectionManager, times(1)).refreshLocalConnections();
    }
}
