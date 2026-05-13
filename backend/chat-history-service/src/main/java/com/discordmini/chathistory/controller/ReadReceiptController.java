package com.discordmini.chathistory.controller;

import com.discordmini.chathistory.model.dto.MarkReadRequest;
import com.discordmini.chathistory.model.dto.ReadReceiptResponse;
import com.discordmini.chathistory.service.ReadReceiptService;
import com.discordmini.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class ReadReceiptController {

    private final ReadReceiptService readReceiptService;

    @PutMapping("/rooms/{roomId}/channels/{channelId}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String roomId,
            @PathVariable String channelId,
            @RequestBody MarkReadRequest request) {

        readReceiptService.markAsRead(userId, roomId, channelId, request.getLastReadMessageId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @GetMapping("/rooms/{roomId}/channels/{channelId}/unread")
    public ResponseEntity<ApiResponse<ReadReceiptResponse>> getUnreadCount(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable String roomId,
            @PathVariable String channelId) {

        ReadReceiptResponse response = readReceiptService.getUnreadCount(userId, roomId, channelId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
