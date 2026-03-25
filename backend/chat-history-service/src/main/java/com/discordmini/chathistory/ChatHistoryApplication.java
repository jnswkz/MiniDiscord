package com.discordmini.chathistory;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

@SpringBootApplication
@EnableDiscoveryClient
public class ChatHistoryApplication {
    public static void main(String[] args) {
        SpringApplication.run(ChatHistoryApplication.class, args);
    }
}
