package com.discordmini.messaging.listener;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class MemberEventListenerTest {

    @Mock
    private StringRedisTemplate redisTemplate;

    @InjectMocks
    private MemberEventListener listener;

    @Test
    void onMemberRemoved_EvictsCacheImmediately() {
        Map<String, Object> event = new HashMap<>();
        event.put("roomId", "room1");
        
        listener.onMemberRemoved(event);
        
        verify(redisTemplate, times(1)).delete("room:members:room1");
    }
}
