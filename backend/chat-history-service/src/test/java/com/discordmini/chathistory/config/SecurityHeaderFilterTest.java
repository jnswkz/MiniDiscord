package com.discordmini.chathistory.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;

import java.io.PrintWriter;
import java.io.StringWriter;

import static org.mockito.Mockito.*;

class SecurityHeaderFilterTest {

    @Test
    void doFilter_MissingUserId_Returns401() throws Exception {
        SecurityHeaderFilter filter = new SecurityHeaderFilter();
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getRequestURI()).thenReturn("/api/messages");
        when(request.getHeader("X-User-Id")).thenReturn(null);
        StringWriter stringWriter = new StringWriter();
        PrintWriter printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);

        filter.doFilter(request, response, chain);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        verify(chain, never()).doFilter(request, response);
    }

    @Test
    void doFilter_WithUserId_Proceeds() throws Exception {
        SecurityHeaderFilter filter = new SecurityHeaderFilter();
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        FilterChain chain = mock(FilterChain.class);

        when(request.getRequestURI()).thenReturn("/api/messages");
        when(request.getHeader("X-User-Id")).thenReturn("user1");

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
    }
}
