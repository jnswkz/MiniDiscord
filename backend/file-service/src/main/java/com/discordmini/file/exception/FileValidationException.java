package com.discordmini.file.exception;

import com.discordmini.common.exception.BaseException;
import org.springframework.http.HttpStatus;

public class FileValidationException extends BaseException {
    public FileValidationException(String message) {
        super(message, HttpStatus.BAD_REQUEST, "FILE_VALIDATION_ERROR");
    }
}
