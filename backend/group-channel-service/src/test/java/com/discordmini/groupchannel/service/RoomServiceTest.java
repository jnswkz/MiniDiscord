package com.discordmini.groupchannel.service;

import com.discordmini.groupchannel.event.RoomCreatedEvent;
import com.discordmini.groupchannel.model.dto.CreateRoomRequest;
import com.discordmini.groupchannel.model.entity.Channel;
import com.discordmini.groupchannel.model.entity.Room;
import com.discordmini.groupchannel.model.entity.RoomParticipant;
import com.discordmini.groupchannel.model.enums.ChannelType;
import com.discordmini.groupchannel.model.enums.RoomType;
import com.discordmini.groupchannel.repository.ChannelRepository;
import com.discordmini.groupchannel.repository.RoomParticipantRepository;
import com.discordmini.groupchannel.repository.RoomRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RoomServiceTest {

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository participantRepository;

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private RoomService roomService;

    private UUID ownerId;
    private CreateRoomRequest request;
    private Room mockRoom;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        request = new CreateRoomRequest();
        request.setName("Test Room");
        request.setType(RoomType.GROUP);
        request.setDescription("A test room");

        mockRoom = Room.builder()
                .id(UUID.randomUUID())
                .name("Test Room")
                .type(RoomType.GROUP)
                .ownerId(ownerId)
                .build();
    }

    @Test
    void createRoom_Success_ShouldCreateRoomOwnerAndDefaultChannelAndPublishEvent() {
        // Arrange
        when(roomRepository.save(any(Room.class))).thenReturn(mockRoom);

        // Act
        Room createdRoom = roomService.createRoom(request, ownerId);

        // Assert
        assertNotNull(createdRoom);
        assertEquals(mockRoom.getId(), createdRoom.getId());

        // Verify Participant Save
        verify(participantRepository, times(1)).save(any(RoomParticipant.class));
        
        // Verify Default Channel Save
        ArgumentCaptor<Channel> channelCaptor = ArgumentCaptor.forClass(Channel.class);
        verify(channelRepository, times(1)).save(channelCaptor.capture());
        Channel savedChannel = channelCaptor.getValue();
        assertEquals("general", savedChannel.getName());
        assertEquals(ChannelType.TEXT, savedChannel.getType());
        assertEquals(0, savedChannel.getPosition());

        // Verify Event Publishing
        verify(eventPublisher, times(1)).publishEvent(any(RoomCreatedEvent.class));
    }
}
