package com.discordmini.messaging.service;

import com.discordmini.common.event.MessageEvent;
import com.discordmini.messaging.config.RabbitMQConfig;
import com.discordmini.messaging.model.dto.ChatMessage;
import com.discordmini.messaging.model.dto.TargetedMessage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageRouterTest {

    @Mock
    private RabbitTemplate rabbitTemplate;

    @Mock
    private ConnectionManager connectionManager;

    @Mock
    private StringRedisTemplate redisTemplate;

    @Mock
    private SetOperations<String, String> setOperations;

    @InjectMocks
    private MessageRouter messageRouter;

    @Test
    void publishToHistory_SendsMessageToRabbitMQ() {
        MessageEvent event = new MessageEvent();
        event.setMessageId("msg1");
        
        messageRouter.publishToHistory(event);
        
        verify(rabbitTemplate, times(1)).convertAndSend(eq(RabbitMQConfig.CHAT_EXCHANGE), eq("message.sent"), eq(event));
    }

    @Test
    void fanOutToMembers_SendsToCorrectInstances() {
        String roomId = "room1";
        ChatMessage message = new ChatMessage();
        message.setRoomId(roomId);

        when(redisTemplate.opsForSet()).thenReturn(setOperations);
        when(setOperations.members("room:members:room1")).thenReturn(Set.of("user1", "user2", "user3"));
        
        // user1 and user2 on instanceA, user3 on instanceB
        when(connectionManager.getInstanceForUser("user1")).thenReturn("instanceA");
        when(connectionManager.getInstanceForUser("user2")).thenReturn("instanceA");
        when(connectionManager.getInstanceForUser("user3")).thenReturn("instanceB");

        messageRouter.fanOutToMembers(message, roomId);

        ArgumentCaptor<TargetedMessage> msgCaptor = ArgumentCaptor.forClass(TargetedMessage.class);
        
        verify(rabbitTemplate, times(1)).convertAndSend(eq(RabbitMQConfig.WS_EXCHANGE), eq("server.instanceA"), msgCaptor.capture());
        verify(rabbitTemplate, times(1)).convertAndSend(eq(RabbitMQConfig.WS_EXCHANGE), eq("server.instanceB"), msgCaptor.capture());
        
        // Assertions can be more detailed but verify the calls were made
    }
}
