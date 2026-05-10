package com.discordmini.groupchannel.model.dto;

import com.discordmini.groupchannel.model.enums.ChannelType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChannelRequest {
    @NotBlank(message = "Channel name cannot be empty")
    private String name;

    @NotNull(message = "Channel type cannot be null")
    private ChannelType type;
}
