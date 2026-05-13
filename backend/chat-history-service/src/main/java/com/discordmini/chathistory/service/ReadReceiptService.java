package com.discordmini.chathistory.service;

import com.discordmini.chathistory.client.MembershipClient;
import com.discordmini.chathistory.model.document.Message;
import com.discordmini.chathistory.model.document.ReadReceipt;
import com.discordmini.chathistory.model.dto.ReadReceiptResponse;
import com.discordmini.chathistory.repository.ReadReceiptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ReadReceiptService {

    private final ReadReceiptRepository readReceiptRepository;
    private final MembershipClient membershipClient;
    private final MongoTemplate mongoTemplate;

    public void markAsRead(String userId, String roomId, String channelId, String lastReadMessageId) {
        membershipClient.verifyMembership(userId, roomId);

        // Try atomic update first
        long updatedCount = readReceiptRepository.updateLastReadIfNewer(userId, channelId, lastReadMessageId, LocalDateTime.now());

        if (updatedCount == 0) {
            // Either the receipt doesn't exist, or the new messageId is older than existing one
            readReceiptRepository.findByUserIdAndChannelId(userId, channelId)
                    .ifPresentOrElse(
                        existing -> {
                            // Already exists but newReadId <= lastReadMessageId, do nothing (multi-device safe)
                        },
                        () -> {
                            // Does not exist, create new
                            ReadReceipt newReceipt = ReadReceipt.builder()
                                    .userId(userId)
                                    .roomId(roomId)
                                    .channelId(channelId)
                                    .lastReadMessageId(lastReadMessageId)
                                    .lastReadAt(LocalDateTime.now())
                                    .build();
                            readReceiptRepository.save(newReceipt);
                        }
                    );
        }
    }

    public ReadReceiptResponse getUnreadCount(String userId, String roomId, String channelId) {
        membershipClient.verifyMembership(userId, roomId);

        String lastReadMessageId = readReceiptRepository.findByUserIdAndChannelId(userId, channelId)
                .map(ReadReceipt::getLastReadMessageId)
                .orElse(null);

        Query query = new Query();
        query.addCriteria(Criteria.where("roomId").is(roomId)
                .and("channelId").is(channelId)
                .and("isDeleted").is(false));

        if (lastReadMessageId != null) {
            query.addCriteria(Criteria.where("_id").gt(lastReadMessageId));
        }

        // Bounded count: cap at 100
        query.limit(100);
        long count = mongoTemplate.count(query, Message.class);

        boolean hasMore = count >= 100;
        String displayCount = hasMore ? "99+" : String.valueOf(count);

        return ReadReceiptResponse.builder()
                .count(count)
                .hasMore(hasMore)
                .displayCount(displayCount)
                .build();
    }
}
