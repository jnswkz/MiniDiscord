package com.discordmini.chathistory.exception;

import com.discordmini.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class ForbiddenException extends BaseException {
    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN, "FORBIDDEN_ERROR");
    }
}
