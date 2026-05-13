package com.discordmini.messaging.handler;

import com.discordmini.messaging.service.ConnectionManager;
import com.discordmini.messaging.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.security.Principal;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketEventHandler {

    private final ConnectionManager connectionManager;
    private final PresenceService presenceService; // Will be created in Step 5

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        if (user != null) {
            String userId = user.getName();
            String sessionId = accessor.getSessionId();
            
            connectionManager.registerConnection(userId, sessionId);
            presenceService.setUserOnline(userId);
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        Principal user = accessor.getUser();
        if (user != null) {
            String userId = user.getName();
            String sessionId = accessor.getSessionId();
            
            connectionManager.unregisterConnection(userId, sessionId);
            // In a real app we might want to delay offline status or check if they reconnected on another device
            // but for this phase we will immediately mark offline. 
            // The scheduled task will also clean up zombies.
            presenceService.setUserOffline(userId);
        }
    }
}
