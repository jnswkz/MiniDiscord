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

    // Lấy tin nhắn mới nhất trong channel (không cần cursor)
    List<Message> findByRoomIdAndChannelIdAndIsDeletedFalseOrderByIdDesc(String roomId, String channelId, Pageable pageable);

    Optional<Message> findByMessageId(String messageId);

    // Cursor pagination (ESR rule: Equality -> Sort -> Range)
    List<Message> findByRoomIdAndChannelIdAndIdLessThanAndIsDeletedFalseOrderByIdDesc(String roomId, String channelId, String cursor, Pageable pageable);

    // Tìm kiếm full text trong channel
    @Query("{ 'roomId': ?0, 'channelId': ?1, 'isDeleted': false, '$text': { '$search': ?2 } }")
    List<Message> searchMessages(String roomId, String channelId, String keyword, Pageable pageable);
}
