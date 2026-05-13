package com.discordmini.chathistory.repository;

import com.discordmini.chathistory.model.document.ReadReceipt;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.Update;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface ReadReceiptRepository extends MongoRepository<ReadReceipt, String> {

    Optional<ReadReceipt> findByUserIdAndChannelId(String userId, String channelId);

    // Atomic update for multi-device concurrency
    @Query("{ 'userId': ?0, 'channelId': ?1, 'lastReadMessageId': { '$lt': ?2 } }")
    @Update("{ '$set': { 'lastReadMessageId': ?2, 'lastReadAt': ?3 } }")
    long updateLastReadIfNewer(String userId, String channelId, String newReadId, LocalDateTime now);
}
