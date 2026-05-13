package com.discordmini.chathistory.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
public class Message {

    @Id
    private String id; // ObjectId

    @Indexed(unique = true)
    private String messageId;

    @Indexed
    private String roomId;

    @Indexed
    private String channelId;

    @Indexed
    private String senderId;

    private String senderName;
    private String senderAvatar;

    private String type;
    private String content;

    private String fileUrl;
    private String fileName;
    private Long fileSize;

    @Builder.Default
    private boolean isEdited = false;

    @Builder.Default
    private boolean isDeleted = false;

    private LocalDateTime deletedAt;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private ReplyInfoDoc replyTo;
}
