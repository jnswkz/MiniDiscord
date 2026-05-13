package com.discordmini.messaging.handler;

import java.security.Principal;

public class StompPrincipal implements Principal {
    private final String name; // This will hold the userId

    public StompPrincipal(String name) {
        this.name = name;
    }

    @Override
    public String getName() {
        return name;
    }
}
