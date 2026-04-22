package com.discordmini.user.exception;

import com.discordmini.common.exception.BaseException;
import org.springframework.http.HttpStatus;

import java.util.UUID;

public class UserNotFoundException extends BaseException {

    public UserNotFoundException(UUID userId) {
        super("User not found: " + userId, HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }

    public UserNotFoundException(String identifier) {
        super("User not found: " + identifier, HttpStatus.NOT_FOUND, "USER_NOT_FOUND");
    }
}
