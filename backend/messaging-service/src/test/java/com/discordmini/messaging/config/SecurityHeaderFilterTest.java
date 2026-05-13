package com.discordmini.messaging.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.io.PrintWriter;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityHeaderFilterTest {

    @InjectMocks
    private SecurityHeaderFilter filter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;
    
    @Mock
    private PrintWriter printWriter;

    @Test
    void request_WithoutXUserId_Returns401() throws IOException, ServletException {
        when(request.getRequestURI()).thenReturn("/api/messages/send");
        when(request.getHeader("X-User-Id")).thenReturn(null);
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilter(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void request_WithXUserId_PassesThrough() throws IOException, ServletException {
        when(request.getRequestURI()).thenReturn("/api/messages/send");
        when(request.getHeader("X-User-Id")).thenReturn("user1");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void request_WsEndpoint_PassesThrough() throws IOException, ServletException {
        when(request.getRequestURI()).thenReturn("/ws/chat");

        filter.doFilter(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(request, never()).getHeader("X-User-Id");
    }
}
