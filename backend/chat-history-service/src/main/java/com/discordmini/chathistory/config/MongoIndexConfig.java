package com.discordmini.chathistory.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexFilter;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;
import org.springframework.data.mongodb.core.query.Criteria;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Configuration
@RequiredArgsConstructor
public class MongoIndexConfig {

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void initIndexes() {
        // TODO (P_FINAL): Tích hợp Mongock để quản lý versioning schema và index migrations an toàn trên production, thay vì chạy script thủ công lúc startup.
        
        // 1. messages: idx_channel_cursor { roomId: 1, channelId: 1, _id: -1 }
        mongoTemplate.indexOps("messages").ensureIndex(
            new Index().on("roomId", Sort.Direction.ASC)
                       .on("channelId", Sort.Direction.ASC)
                       .on("_id", Sort.Direction.DESC)
                       .named("idx_channel_cursor")
        );

        // 2. messages: idx_messageId { messageId: 1 } UNIQUE
        mongoTemplate.indexOps("messages").ensureIndex(
            new Index().on("messageId", Sort.Direction.ASC)
                       .unique()
                       .named("idx_messageId")
        );

        // 3. messages: idx_sender_time { senderId: 1, createdAt: -1 }
        mongoTemplate.indexOps("messages").ensureIndex(
            new Index().on("senderId", Sort.Direction.ASC)
                       .on("createdAt", Sort.Direction.DESC)
                       .named("idx_sender_time")
        );

        // 4. messages: TTL Index on deletedAt (partial isDeleted: true)
        mongoTemplate.getCollection("messages").createIndex(
            new org.bson.Document("deletedAt", 1),
            new com.mongodb.client.model.IndexOptions()
                .name("idx_ttl_deletedAt")
                .expireAfter(30L, TimeUnit.DAYS)
                .partialFilterExpression(new org.bson.Document("isDeleted", true))
        );
        
        // 5. messages: Text Index
        mongoTemplate.indexOps("messages").ensureIndex(
            new TextIndexDefinition.TextIndexDefinitionBuilder()
                .onField("content")
                .named("idx_text_content")
                .build()
        );

        // 6. read_receipts: idx_user_room_channel { userId: 1, roomId: 1, channelId: 1 } UNIQUE
        mongoTemplate.indexOps("read_receipts").ensureIndex(
            new Index().on("userId", Sort.Direction.ASC)
                       .on("roomId", Sort.Direction.ASC)
                       .on("channelId", Sort.Direction.ASC)
                       .unique()
                       .named("idx_user_room_channel")
        );
    }
}
