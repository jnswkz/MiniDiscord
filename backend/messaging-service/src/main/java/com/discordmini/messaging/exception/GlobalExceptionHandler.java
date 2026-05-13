package com.discordmini.messaging.exception;

import com.discordmini.common.dto.ApiResponse;
import com.discordmini.common.exception.BaseException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.MessageExceptionHandler;
import org.springframework.messaging.simp.annotation.SendToUser;
import org.springframework.web.bind.annotation.ControllerAdvice;

@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    @MessageExceptionHandler(BaseException.class)
    @SendToUser("/queue/errors")
    public ApiResponse<String> handleBaseException(BaseException ex) {
        log.warn("Messaging exception: {}", ex.getMessage());
        return ApiResponse.error(ex.getMessage(), ex.getStatus().name());
    }

    @MessageExceptionHandler(Exception.class)
    @SendToUser("/queue/errors")
    public ApiResponse<String> handleGenericException(Exception ex) {
        log.error("Unexpected messaging error", ex);
        return ApiResponse.error("Internal server error", HttpStatus.INTERNAL_SERVER_ERROR.name());
    }
}
