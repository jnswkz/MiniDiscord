package com.discordmini.chathistory.service;

import com.discordmini.chathistory.client.MembershipClient;
import com.discordmini.chathistory.exception.ForbiddenException;
import com.discordmini.chathistory.exception.ResourceNotFoundException;
import com.discordmini.chathistory.model.document.Message;
import com.discordmini.chathistory.model.dto.MessageResponse;
import com.discordmini.chathistory.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final MembershipClient membershipClient;

    public List<MessageResponse> getMessages(String userId, String roomId, String channelId, String before, int limit) {
        membershipClient.verifyMembership(userId, roomId);

        int actualLimit = Math.min(limit, 100);
        PageRequest pageRequest = PageRequest.of(0, actualLimit);

        List<Message> messages;
        if (before != null && !before.isBlank()) {
            messages = messageRepository.findByRoomIdAndChannelIdAndIdLessThanAndIsDeletedFalseOrderByIdDesc(roomId, channelId, before, pageRequest);
        } else {
            messages = messageRepository.findByRoomIdAndChannelIdAndIsDeletedFalseOrderByIdDesc(roomId, channelId, pageRequest);
        }

        return messages.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<MessageResponse> searchMessages(String userId, String roomId, String channelId, String keyword, int limit) {
        membershipClient.verifyMembership(userId, roomId);

        int actualLimit = Math.min(limit, 100);
        PageRequest pageRequest = PageRequest.of(0, actualLimit);

        List<Message> messages = messageRepository.searchMessages(roomId, channelId, keyword, pageRequest);
        return messages.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public void softDeleteMessage(String userId, String messageId) {
        Message message = messageRepository.findByMessageId(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));

        if (!message.getSenderId().equals(userId)) {
            throw new ForbiddenException("You can only delete your own messages");
        }

        message.setDeleted(true);
        message.setDeletedAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    private MessageResponse mapToResponse(Message message) {
        MessageResponse.ReplyInfoResponse replyInfoResponse = null;
        if (message.getReplyTo() != null) {
            replyInfoResponse = MessageResponse.ReplyInfoResponse.builder()
                    .messageId(message.getReplyTo().getMessageId())
                    .content(message.getReplyTo().getContent())
                    .senderName(message.getReplyTo().getSenderName())
                    .build();
        }

        return MessageResponse.builder()
                .id(message.getId())
                .messageId(message.getMessageId())
                .roomId(message.getRoomId())
                .channelId(message.getChannelId())
                .senderId(message.getSenderId())
                .senderName(message.getSenderName())
                .senderAvatar(message.getSenderAvatar())
                .type(message.getType())
                .content(message.getContent())
                .fileUrl(message.getFileUrl())
                .fileName(message.getFileName())
                .fileSize(message.getFileSize())
                .isEdited(message.isEdited())
                .isDeleted(message.isDeleted())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .replyTo(replyInfoResponse)
                .build();
    }
}
