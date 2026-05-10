package com.discordmini.groupchannel.model.dto;

import lombok.Data;

@Data
public class UpdateRoomRequest {
    private String name;
    private String description;
    private String iconUrl;
}
