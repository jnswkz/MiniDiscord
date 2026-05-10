package com.discordmini.user.model.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthRequest {
    @NotBlank(message = "Token must not be empty")
    private String idToken;
}
