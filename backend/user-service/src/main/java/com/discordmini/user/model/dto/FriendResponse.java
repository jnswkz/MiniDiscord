package com.discordmini.user.model.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendResponse {
    private UUID friendshipId;
    private UserResponse user;
    private String status;
    private LocalDateTime since;
}
