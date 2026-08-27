package com.abhinav.linkedin.notification_service.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class UserContextFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String userIdHeader = request.getHeader("X-User-Id");
        if (userIdHeader == null || userIdHeader.isBlank()) {
            userIdHeader = request.getHeader("X_UserId");
            if (userIdHeader == null || userIdHeader.isBlank()) {
                userIdHeader = request.getHeader("X-UserId");
            }
        }

        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                Long userId = Long.parseLong(userIdHeader.trim());
                UserContextHolder.setCurrentUserId(userId);
                log.debug("Set UserContextHolder in notification-service with userId: {}", userId);
            } catch (NumberFormatException e) {
                log.warn("Invalid X-User-Id header value: {}", userIdHeader);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            UserContextHolder.clear();
        }
    }
}
