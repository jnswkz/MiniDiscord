package com.discordmini.groupchannel.controller;

import com.discordmini.common.dto.ApiResponse;
import com.discordmini.groupchannel.model.dto.ChannelRequest;
import com.discordmini.groupchannel.model.entity.Channel;
import com.discordmini.groupchannel.service.ChannelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ChannelController {

    private final ChannelService channelService;

    @PostMapping("/rooms/{roomId}/channels")
    public ResponseEntity<ApiResponse<Channel>> createChannel(
            @RequestHeader("X-User-Id") UUID requesterId,
            @PathVariable UUID roomId,
            @Valid @RequestBody ChannelRequest request) {
        Channel channel = channelService.createChannel(roomId, requesterId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Channel created successfully", channel));
    }

    @GetMapping("/rooms/{roomId}/channels")
    public ResponseEntity<ApiResponse<List<Channel>>> getChannels(@PathVariable UUID roomId) {
        List<Channel> channels = channelService.getChannels(roomId);
        return ResponseEntity.ok(ApiResponse.ok("Channels fetched", channels));
    }
}
