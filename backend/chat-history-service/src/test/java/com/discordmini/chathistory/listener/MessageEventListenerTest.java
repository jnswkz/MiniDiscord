package com.discordmini.chathistory.listener;

import com.discordmini.chathistory.model.document.Message;
import com.discordmini.chathistory.repository.MessageRepository;
import com.discordmini.common.event.MessageEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MessageEventListenerTest {

    @Mock
    private MessageRepository messageRepository;

    @InjectMocks
    private MessageEventListener messageEventListener;

    @Test
    void handleMessageEvent_Success() {
        MessageEvent event = MessageEvent.builder()
                .messageId("m1")
                .content("hello")
                .build();

        when(messageRepository.insert(any(Message.class))).thenReturn(new Message());

        messageEventListener.handleMessageEvent(event);

        verify(messageRepository, times(1)).insert(any(Message.class));
    }

    @Test
    void handleMessageEvent_DuplicateKey_HandledGracefully() {
        MessageEvent event = MessageEvent.builder().messageId("m1").build();

        when(messageRepository.insert(any(Message.class)))
                .thenThrow(new DuplicateKeyException("duplicate"));

        assertDoesNotThrow(() -> messageEventListener.handleMessageEvent(event));
    }
}
