package com.discordmini.messaging.listener;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.ExchangeTypes;
import org.springframework.amqp.rabbit.annotation.Exchange;
import org.springframework.amqp.rabbit.annotation.Queue;
import org.springframework.amqp.rabbit.annotation.QueueBinding;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemberEventListener {

    private final StringRedisTemplate redisTemplate;

    @RabbitListener(bindings = @QueueBinding(
            value = @Queue(name = "messaging.room-events.queue", durable = "true"),
            exchange = @Exchange(name = "room.events", type = ExchangeTypes.TOPIC),
            key = {"member.removed", "member.left"}
    ))
    public void onMemberRemoved(Map<String, Object> event) {
        String roomId = (String) event.get("roomId");
        if (roomId != null) {
            log.info("Member removed/left event received for room {}, evicting cache", roomId);
            redisTemplate.delete("room:members:" + roomId);
        }
    }
}
