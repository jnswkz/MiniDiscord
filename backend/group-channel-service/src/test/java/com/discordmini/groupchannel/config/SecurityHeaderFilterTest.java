package com.discordmini.groupchannel.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityHeaderFilterTest {

    @InjectMocks
    private SecurityHeaderFilter filter;

    @Mock
    private FilterChain filterChain;

    private MockHttpServletRequest request;
    private MockHttpServletResponse response;

    @BeforeEach
    void setUp() {
        request = new MockHttpServletRequest();
        response = new MockHttpServletResponse();
    }

    @Test
    void doFilter_WithActuatorPath_ShouldSkipFilter() throws ServletException, IOException {
        request.setRequestURI("/actuator/health");
        
        filter.doFilter(request, response, filterChain);
        
        verify(filterChain, times(1)).doFilter(request, response);
    }

    @Test
    void doFilter_WithoutUserIdHeader_ShouldReturn401() throws ServletException, IOException {
        request.setRequestURI("/api/rooms");
        
        filter.doFilter(request, response, filterChain);
        
        assertEquals(401, response.getStatus());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void doFilter_WithUserIdHeader_ShouldProceed() throws ServletException, IOException {
        request.setRequestURI("/api/rooms");
        request.addHeader("X-User-Id", UUID.randomUUID().toString());
        
        filter.doFilter(request, response, filterChain);
        
        verify(filterChain, times(1)).doFilter(request, response);
    }
}
