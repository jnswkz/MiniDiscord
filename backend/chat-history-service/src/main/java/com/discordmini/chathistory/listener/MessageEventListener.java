package com.discordmini.chathistory.listener;

import com.discordmini.chathistory.model.document.Message;
import com.discordmini.chathistory.model.document.ReplyInfoDoc;
import com.discordmini.chathistory.repository.MessageRepository;
import com.discordmini.common.event.MessageEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageEventListener {

    private final MessageRepository messageRepository;

    @RabbitListener(queues = "chat-history.message.queue")
    public void handleMessageEvent(MessageEvent event) {
        log.info("Received MessageEvent: {}", event.getMessageId());

        try {
            ReplyInfoDoc replyInfoDoc = null;
            if (event.getReplyTo() != null) {
                replyInfoDoc = ReplyInfoDoc.builder()
                        .messageId(event.getReplyTo().getMessageId())
                        .content(event.getReplyTo().getContent())
                        .senderName(event.getReplyTo().getSenderName())
                        .build();
            }

            Message message = Message.builder()
                    .messageId(event.getMessageId())
                    .roomId(event.getRoomId())
                    .channelId(event.getChannelId())
                    .senderId(event.getSenderId())
                    .senderName(event.getSenderName())
                    .senderAvatar(event.getSenderAvatar())
                    .type(event.getType())
                    .content(event.getContent())
                    .fileUrl(event.getFileUrl())
                    .fileName(event.getFileName())
                    .fileSize(event.getFileSize())
                    .isEdited(false)
                    .isDeleted(false)
                    .createdAt(event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now())
                    .replyTo(replyInfoDoc)
                    .build();

            // Use insert() to enforce Idempotent Consumer via DuplicateKeyException
            messageRepository.insert(message);
            log.info("Successfully inserted message: {}", event.getMessageId());

        } catch (DuplicateKeyException e) {
            log.warn("Message with messageId {} already exists. Ignoring duplicate.", event.getMessageId());
        } catch (Exception e) {
            log.error("Error processing MessageEvent: {}", e.getMessage(), e);
            throw e; // throw so RabbitMQ can nack and retry if needed
        }
    }
}
