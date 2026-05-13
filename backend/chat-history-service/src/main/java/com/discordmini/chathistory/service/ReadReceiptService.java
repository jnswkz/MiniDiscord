package com.discordmini.chathistory.service;

import com.discordmini.chathistory.client.MembershipClient;
import com.discordmini.chathistory.model.document.ReadReceipt;
import com.discordmini.chathistory.model.dto.ReadReceiptResponse;
import com.discordmini.chathistory.repository.MessageRepository;
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
    private final MessageRepository messageRepository;
    private final MembershipClient membershipClient;
    private final MongoTemplate mongoTemplate;

    private static final int UNREAD_CAP = 100;

    public void markAsRead(String userId, String roomId, String channelId, String lastReadMessageId) {
        membershipClient.verifyMembership(userId, roomId);

        // Atomic update: only update if new ID is greater
        long modified = readReceiptRepository.updateLastReadIfNewer(userId, channelId, lastReadMessageId, LocalDateTime.now());

        if (modified == 0) {
            // Either no receipt exists or the existing one has a newer ID
            readReceiptRepository.findByUserIdAndChannelId(userId, channelId)
                    .ifPresentOrElse(
                            existing -> { /* Already has a newer read — do nothing */ },
                            () -> {
                                // First time reading this channel
                                ReadReceipt receipt = ReadReceipt.builder()
                                        .userId(userId)
                                        .roomId(roomId)
                                        .channelId(channelId)
                                        .lastReadMessageId(lastReadMessageId)
                                        .lastReadAt(LocalDateTime.now())
                                        .build();
                                readReceiptRepository.save(receipt);
                            }
                    );
        }
    }

    public ReadReceiptResponse getUnreadCount(String userId, String roomId, String channelId) {
        membershipClient.verifyMembership(userId, roomId);

        String lastReadId = readReceiptRepository.findByUserIdAndChannelId(userId, channelId)
                .map(ReadReceipt::getLastReadMessageId)
                .orElse(null);

        Query query = new Query();
        query.addCriteria(Criteria.where("roomId").is(roomId));
        query.addCriteria(Criteria.where("channelId").is(channelId));
        query.addCriteria(Criteria.where("isDeleted").is(false));

        if (lastReadId != null) {
            query.addCriteria(Criteria.where("_id").gt(new org.bson.types.ObjectId(lastReadId)));
        }

        // Bounded count: cap at 100 to avoid full collection scan
        query.limit(UNREAD_CAP);
        long count = mongoTemplate.count(query, "messages");

        boolean hasMore = count >= UNREAD_CAP;
        String displayCount = hasMore ? "99+" : String.valueOf(count);

        return ReadReceiptResponse.builder()
                .count(Math.min(count, UNREAD_CAP - 1))
                .displayCount(displayCount)
                .hasMore(hasMore)
                .build();
    }
}
