package com.discordmini.user.model.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendEvent implements Serializable {
    private UUID fromUserId;
    private UUID toUserId;
    private String type; // FRIEND_REQUEST_SENT, FRIEND_ACCEPTED, FRIEND_REMOVED
}
