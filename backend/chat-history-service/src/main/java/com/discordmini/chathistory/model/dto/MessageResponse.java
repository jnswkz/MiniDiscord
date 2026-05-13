package com.discordmini.chathistory.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String id; // This is the ObjectId string format for cursor pagination
    private String messageId;
    private String roomId;
    private String channelId;
    private String senderId;
    private String senderName;
    private String senderAvatar;
    private String type;
    private String content;
    private String fileUrl;
    private String fileName;
    private Long fileSize;
    private boolean isEdited;
    private boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private ReplyInfoResponse replyTo;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReplyInfoResponse {
        private String messageId;
        private String content;
        private String senderName;
    }
}
