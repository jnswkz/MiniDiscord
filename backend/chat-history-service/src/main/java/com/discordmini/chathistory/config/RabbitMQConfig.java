package com.discordmini.chathistory.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String CHAT_EXCHANGE = "chat.exchange";
    public static final String MESSAGE_QUEUE = "chat-history.message.queue";
    public static final String MESSAGE_ROUTING_KEY = "message.sent";

    @Bean
    public TopicExchange chatExchange() {
        return new TopicExchange(CHAT_EXCHANGE);
    }

    @Bean
    public Queue messageQueue() {
        return new Queue(MESSAGE_QUEUE, true); // durable
    }

    @Bean
    public Binding binding(Queue messageQueue, TopicExchange chatExchange) {
        return BindingBuilder.bind(messageQueue).to(chatExchange).with(MESSAGE_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
