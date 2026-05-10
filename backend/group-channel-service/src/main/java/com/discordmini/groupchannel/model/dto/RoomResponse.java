package com.discordmini.groupchannel.model.dto;

import com.discordmini.groupchannel.model.enums.RoomType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class RoomResponse {
    private UUID id;
    private String name;
    private String description;
    private String iconUrl;
    private RoomType type;
    private UUID ownerId;
    private LocalDateTime createdAt;
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
