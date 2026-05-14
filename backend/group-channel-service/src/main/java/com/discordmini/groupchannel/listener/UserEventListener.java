package com.discordmini.groupchannel.listener;

import com.discordmini.groupchannel.model.entity.Room;
import com.discordmini.groupchannel.model.event.UserRegisteredEvent;
import com.discordmini.groupchannel.service.MembershipService;
import com.discordmini.groupchannel.service.RoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserEventListener {

    private final RoomService roomService;
    private final MembershipService membershipService;

    @RabbitListener(queues = "${rabbitmq.queues.user-registered}")
    public void onUserRegistered(UserRegisteredEvent event) {
        log.info("Received UserRegisteredEvent for user: {}", event.getUsername());
        try {
            Room rootGroup = roomService.getOrCreateRootGroup();
            membershipService.addMemberIfNotExists(rootGroup.getId(), event.getUserId());
            log.info("Successfully added user {} to root group", event.getUsername());
        } catch (Exception e) {
            log.error("Failed to process UserRegisteredEvent for user: {}", event.getUsername(), e);
        }
    }
}
