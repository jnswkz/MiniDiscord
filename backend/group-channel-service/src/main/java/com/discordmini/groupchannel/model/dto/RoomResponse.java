package com.discordmini.groupchannel.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private UUID id;
    private String name;
    private String description;
    private String iconUrl;
    private String type;
    private UUID ownerId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Boolean isActive;
    
    private long memberCount;
    private List<ChannelDto> channels;
    
    @Data
    @Builder
    public static class ChannelDto {
        private UUID id;
        private String name;
        private String type;
        private Integer position;
    }
}
