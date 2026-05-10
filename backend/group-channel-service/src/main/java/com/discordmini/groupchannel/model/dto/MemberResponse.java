package com.discordmini.groupchannel.model.dto;

import com.discordmini.groupchannel.model.enums.RoomRole;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MemberResponse {
    private UUID userId;
    private RoomRole role;
    private LocalDateTime joinedAt;
}
