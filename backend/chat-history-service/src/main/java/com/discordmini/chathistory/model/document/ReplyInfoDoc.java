package com.discordmini.chathistory.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReplyInfoDoc {
    private String messageId;
    private String content;
    private String senderName;
}
