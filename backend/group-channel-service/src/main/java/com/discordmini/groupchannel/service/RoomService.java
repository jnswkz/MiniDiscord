package com.discordmini.groupchannel.service;

import com.discordmini.groupchannel.event.RoomCreatedEvent;
import com.discordmini.groupchannel.model.dto.CreateRoomRequest;
import com.discordmini.groupchannel.model.entity.Channel;
import com.discordmini.groupchannel.model.entity.Room;
import com.discordmini.groupchannel.model.entity.RoomParticipant;
import com.discordmini.groupchannel.model.enums.ChannelType;
import com.discordmini.groupchannel.model.enums.RoomRole;
import com.discordmini.groupchannel.repository.ChannelRepository;
import com.discordmini.groupchannel.repository.RoomParticipantRepository;
import com.discordmini.groupchannel.repository.RoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final ChannelRepository channelRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional
    public Room createRoom(CreateRoomRequest request, UUID ownerId) {
        // 1. Create Room
        Room room = Room.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .ownerId(ownerId)
                .build();
        room = roomRepository.save(room);

        // 2. Add Owner as Participant
        RoomParticipant owner = RoomParticipant.builder()
                .room(room)
                .userId(ownerId)
                .role(RoomRole.OWNER)
                .build();
        participantRepository.save(owner);

        // 3. Create Default Channel
        Channel defaultChannel = Channel.builder()
                .room(room)
                .name("general")
                .type(ChannelType.TEXT)
                .position(0)
                .build();
        channelRepository.save(defaultChannel);

        // 4. Publish Event (Will be handled asynchronously after commit)
        eventPublisher.publishEvent(new RoomCreatedEvent(room.getId(), ownerId, room.getName(), room.getType()));

        return room;
    }
}
