package com.discordmini.groupchannel.model.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AddMemberRequest {
    @NotNull(message = "User ID cannot be null")
    private UUID userId;
}
