package com.discordmini.chathistory.controller;

import com.discordmini.chathistory.model.dto.MessageResponse;
import com.discordmini.chathistory.service.MessageService;
import com.discordmini.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/rooms/{roomId}/channels/{channelId}")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessages(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String roomId,
            @PathVariable String channelId,
            @RequestParam(required = false) String before,
            @RequestParam(defaultValue = "50") int limit) {

        List<MessageResponse> messages = messageService.getMessages(userId, roomId, channelId, before, limit);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @GetMapping("/rooms/{roomId}/channels/{channelId}/search")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> searchMessages(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String roomId,
            @PathVariable String channelId,
            @RequestParam String q,
            @RequestParam(defaultValue = "50") int limit) {

        List<MessageResponse> messages = messageService.searchMessages(userId, roomId, channelId, q, limit);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String messageId) {

        messageService.softDeleteMessage(userId, messageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
