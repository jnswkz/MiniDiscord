package com.discordmini.chathistory.client;

import com.discordmini.chathistory.exception.ForbiddenException;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class MembershipClient {

    private final RestClient restClient;

    public MembershipClient(RestClient.Builder builder) {
        this.restClient = builder.baseUrl("lb://group-channel-service").build();
    }

    public void verifyMembership(String userId, String roomId) {
        restClient.get()
            .uri("/api/rooms/{roomId}/members/{userId}", roomId, userId)
            .retrieve()
            .onStatus(HttpStatusCode::is4xxClientError, (req, res) -> {
                throw new ForbiddenException("Not a member of this room");
            })
            .toBodilessEntity();
    }
}
