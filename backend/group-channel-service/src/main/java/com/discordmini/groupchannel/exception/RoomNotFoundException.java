package com.discordmini.groupchannel.exception;

import com.discordmini.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class RoomNotFoundException extends BaseException {
    public RoomNotFoundException(String message) {
        super(message, HttpStatus.NOT_FOUND, "ROOM_NOT_FOUND");
    }
}
