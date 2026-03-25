package com.discordmini.common.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageEvent implements Serializable {

    private String messageId;
    private String roomId;
    private String channelId;
    private String senderId;
    private String senderName;
    private String content;
    private String type;       // TEXT, IMAGE, FILE, SYSTEM
    private String fileUrl;
    private LocalDateTime createdAt;
}
