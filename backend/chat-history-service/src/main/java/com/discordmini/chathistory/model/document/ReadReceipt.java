package com.discordmini.chathistory.model.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "read_receipts")
@CompoundIndex(name = "idx_user_room_channel", def = "{'userId': 1, 'roomId': 1, 'channelId': 1}", unique = true)
public class ReadReceipt {

    @Id
    private String id;

    private String userId;
    private String roomId;
    private String channelId;
    private String lastReadMessageId; // ObjectId string
    private LocalDateTime lastReadAt;
}
