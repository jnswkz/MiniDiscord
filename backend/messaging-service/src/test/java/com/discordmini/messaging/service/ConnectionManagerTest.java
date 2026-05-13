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

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ConnectionManagerTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private ConnectionManager connectionManager;

    @BeforeEach
    void setUp() {
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
    }

    @Test
    void registerConnection_SavesToLocalAndRedis() {
        String userId = "user1";
        String sessionId = "sess1";
        
        connectionManager.registerConnection(userId, sessionId);
        
        assertTrue(connectionManager.isLocalUser(userId));
        verify(valueOperations, times(1)).set(eq("conn:user:" + userId), eq(ConnectionManager.INSTANCE_ID), any(Duration.class));
    }

    @Test
    void unregisterConnection_RemovesFromLocalAndRedis_IfMatches() {
        String userId = "user1";
        String sessionId = "sess1";
        
        connectionManager.registerConnection(userId, sessionId);
        
        when(valueOperations.get("conn:user:" + userId)).thenReturn(ConnectionManager.INSTANCE_ID);
        
        connectionManager.unregisterConnection(userId, sessionId);
        
        assertFalse(connectionManager.isLocalUser(userId));
        verify(redisTemplate, times(1)).delete("conn:user:" + userId);
    }

    @Test
    void unregisterConnection_DoesNotRemoveFromRedis_IfInstanceChanged() {
        String userId = "user1";
        String sessionId = "sess1";
        
        connectionManager.registerConnection(userId, sessionId);
        
        // Simulate another instance took over
        when(valueOperations.get("conn:user:" + userId)).thenReturn("other_instance");
        
        connectionManager.unregisterConnection(userId, sessionId);
        
        assertFalse(connectionManager.isLocalUser(userId));
        verify(redisTemplate, never()).delete("conn:user:" + userId);
    }
}
