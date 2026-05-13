package com.discordmini.messaging.model.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TargetedMessage {
    private List<String> targetUserIds;
    private ChatMessage message;
}
