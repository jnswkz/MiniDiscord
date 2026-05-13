package com.discordmini.chathistory.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.TextIndexDefinition;

import java.util.concurrent.TimeUnit;

@Configuration
public class MongoIndexConfig {

    // TODO (P_FINAL): Migrate to Mongock for versioned index management
    @Bean
    public CommandLineRunner ensureIndexes(MongoTemplate mongoTemplate) {
        return args -> {
            // Compound index: cursor pagination (ESR rule)
            mongoTemplate.indexOps("messages").ensureIndex(
                    new Index()
                            .named("idx_channel_cursor")
                            .on("roomId", Sort.Direction.ASC)
                            .on("channelId", Sort.Direction.ASC)
                            .on("_id", Sort.Direction.DESC)
            );

            // Unique index: Idempotent Consumer
            mongoTemplate.indexOps("messages").ensureIndex(
                    new Index()
                            .named("idx_messageId")
                            .on("messageId", Sort.Direction.ASC)
                            .unique()
            );

            // Sender + time index
            mongoTemplate.indexOps("messages").ensureIndex(
                    new Index()
                            .named("idx_sender_time")
                            .on("senderId", Sort.Direction.ASC)
                            .on("createdAt", Sort.Direction.DESC)
            );

            // TTL index: auto-delete 30 days after soft-delete
            mongoTemplate.indexOps("messages").ensureIndex(
                    new Index()
                            .named("idx_ttl_deleted")
                            .on("deletedAt", Sort.Direction.ASC)
                            .expire(30, TimeUnit.DAYS)
                            .partial(org.springframework.data.mongodb.core.index.PartialIndexFilter
                                    .of(org.springframework.data.mongodb.core.query.Criteria.where("isDeleted").is(true)))
            );

            // Text index for search
            mongoTemplate.indexOps("messages").ensureIndex(
                    new TextIndexDefinition.TextIndexDefinitionBuilder()
                            .named("idx_content_text")
                            .onField("content")
                            .build()
            );
        };
    }
}
