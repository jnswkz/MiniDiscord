package com.discordmini.groupchannel.event;

import com.discordmini.groupchannel.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j
public class RoomEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleRoomCreatedEvent(RoomCreatedEvent event) {
        log.info("Publishing room.created event for room {}", event.getRoomId());
        rabbitTemplate.convertAndSend(RabbitMQConfig.EXCHANGE_NAME, "room.created", event);
    }
}
