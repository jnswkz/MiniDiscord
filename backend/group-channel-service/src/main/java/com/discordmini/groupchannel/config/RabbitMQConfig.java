package com.discordmini.groupchannel.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "room.events";

    @Bean
    public TopicExchange roomEventsExchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    // --- User Events Consumer Configuration ---
    
    @org.springframework.beans.factory.annotation.Value("${rabbitmq.queues.user-registered}")
    private String userRegisteredQueueName;

    @Bean
    public org.springframework.amqp.core.Queue userRegisteredQueue() {
        return new org.springframework.amqp.core.Queue(userRegisteredQueueName, true);
    }

    @Bean
    public TopicExchange userEventsExchange() {
        return new TopicExchange("user.events");
    }

    @Bean
    public org.springframework.amqp.core.Binding userRegisteredBinding(org.springframework.amqp.core.Queue userRegisteredQueue, TopicExchange userEventsExchange) {
        return org.springframework.amqp.core.BindingBuilder.bind(userRegisteredQueue).to(userEventsExchange).with("user.registered");
    }
}
