package com.discordmini.chathistory.service;

import com.discordmini.chathistory.client.MembershipClient;
import com.discordmini.chathistory.model.document.Message;
import com.discordmini.chathistory.model.document.ReadReceipt;
import com.discordmini.chathistory.model.dto.ReadReceiptResponse;
import com.discordmini.chathistory.repository.ReadReceiptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Query;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReadReceiptServiceTest {

    @Mock
    private ReadReceiptRepository readReceiptRepository;

    @Mock
    private MembershipClient membershipClient;

    @Mock
    private MongoTemplate mongoTemplate;

    @InjectMocks
    private ReadReceiptService readReceiptService;

    @Test
    void markAsRead_ExistingNewer_DoesUpdate() {
        String userId = "u1", roomId = "r1", channelId = "c1", msgId = "m1";
        doNothing().when(membershipClient).verifyMembership(userId, roomId);
        
        when(readReceiptRepository.updateLastReadIfNewer(eq(userId), eq(channelId), eq(msgId), any()))
                .thenReturn(1L);

        readReceiptService.markAsRead(userId, roomId, channelId, msgId);

        verify(readReceiptRepository).updateLastReadIfNewer(eq(userId), eq(channelId), eq(msgId), any());
        verify(readReceiptRepository, never()).findByUserIdAndChannelId(any(), any());
    }

    @Test
    void markAsRead_NotExists_CreatesNew() {
        String userId = "u1", roomId = "r1", channelId = "c1", msgId = "m1";
        doNothing().when(membershipClient).verifyMembership(userId, roomId);
        
        when(readReceiptRepository.updateLastReadIfNewer(eq(userId), eq(channelId), eq(msgId), any()))
                .thenReturn(0L);
        when(readReceiptRepository.findByUserIdAndChannelId(userId, channelId))
                .thenReturn(Optional.empty());

        readReceiptService.markAsRead(userId, roomId, channelId, msgId);

        verify(readReceiptRepository).save(any(ReadReceipt.class));
    }

    @Test
    void getUnreadCount_BoundedCount() {
        String userId = "u1", roomId = "r1", channelId = "c1";
        doNothing().when(membershipClient).verifyMembership(userId, roomId);

        when(readReceiptRepository.findByUserIdAndChannelId(userId, channelId))
                .thenReturn(Optional.of(ReadReceipt.builder().lastReadMessageId("m1").build()));
        
        when(mongoTemplate.count(any(Query.class), eq(Message.class))).thenReturn(100L);

        ReadReceiptResponse res = readReceiptService.getUnreadCount(userId, roomId, channelId);

        assertEquals(100L, res.getCount());
        assertTrue(res.isHasMore());
        assertEquals("99+", res.getDisplayCount());
    }
}
