package com.discordmini.chathistory.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReadReceiptResponse {
    private long count;
    private boolean hasMore;
    private String displayCount; // e.g., "99+"
}
