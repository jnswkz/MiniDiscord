package com.discordmini.messaging.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.UUID;

@Configuration
public class RabbitMQConfig {

    // Exchange names
    public static final String CHAT_EXCHANGE = "chat.exchange";
    public static final String WS_EXCHANGE = "ws.exchange";
    public static final String ROOM_EVENTS_EXCHANGE = "room.events";

    // Exclusive queue for this instance to receive fan-out messages
    public static final String INSTANCE_QUEUE = "ws.queue." + UUID.randomUUID().toString();

    @Bean
    public TopicExchange chatExchange() {
        return new TopicExchange(CHAT_EXCHANGE);
    }

    @Bean
    public TopicExchange wsExchange() {
        return new TopicExchange(WS_EXCHANGE);
    }
    
    @Bean
    public TopicExchange roomEventsExchange() {
        return new TopicExchange(ROOM_EVENTS_EXCHANGE);
    }

    // This instance's exclusive queue
    @Bean
    public Queue instanceQueue() {
        // non-durable, exclusive, auto-delete
        return new Queue(INSTANCE_QUEUE, false, true, true);
    }

    // Bind this instance's queue to the ws.exchange with its unique routing key
    // The routing key will be the instance ID. For simplicity, we bind it using INSTANCE_QUEUE name
    // Or we could define a specific INSTANCE_ID constant. Let's use INSTANCE_QUEUE as the ID.
    @Bean
    public Binding instanceBinding(Queue instanceQueue, TopicExchange wsExchange) {
        return BindingBuilder.bind(instanceQueue).to(wsExchange).with("server." + INSTANCE_QUEUE);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory, MessageConverter jsonMessageConverter) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter);
        return template;
    }
}
