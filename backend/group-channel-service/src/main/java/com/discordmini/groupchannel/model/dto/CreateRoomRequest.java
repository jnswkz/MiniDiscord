package com.discordmini.groupchannel.model.dto;

import com.discordmini.groupchannel.model.enums.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateRoomRequest {
    @NotBlank(message = "Room name cannot be empty")
    private String name;

    @NotNull(message = "Room type cannot be null")
    private RoomType type;

    private String description;
}
