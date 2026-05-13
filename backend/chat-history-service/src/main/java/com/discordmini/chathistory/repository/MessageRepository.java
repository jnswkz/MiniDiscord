package com.discordmini.chathistory.repository;

import com.discordmini.chathistory.model.document.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {

    // Cursor pagination: first page (no cursor)
    List<Message> findByRoomIdAndChannelIdAndIsDeletedFalseOrderByIdDesc(
            String roomId, String channelId, Pageable pageable);

    // Cursor pagination: subsequent pages (before cursor)
    @Query("{ 'roomId': ?0, 'channelId': ?1, 'isDeleted': false, '_id': { '$lt': { '$oid': ?2 } } }")
    List<Message> findByRoomIdAndChannelIdBeforeCursor(
            String roomId, String channelId, String beforeId, Pageable pageable);

    // Find by event UUID
    Optional<Message> findByMessageId(String messageId);

    // Text search
    @Query("{ 'roomId': ?0, 'channelId': ?1, 'isDeleted': false, '$text': { '$search': ?2 } }")
    List<Message> searchByContent(String roomId, String channelId, String keyword, Pageable pageable);
}
