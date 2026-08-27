package com.abhinav.linkedin.chat_service.auth;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
public class UserContextFilter implements Filter {

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain)
            throws IOException, ServletException {
        HttpServletRequest request = (HttpServletRequest) servletRequest;
        String userIdStr = request.getHeader("X-User-Id");
        if (userIdStr == null || userIdStr.isBlank()) {
            userIdStr = request.getHeader("X-UserId");
        }

        if (userIdStr != null && !userIdStr.isBlank()) {
            try {
                UserContextHolder.setCurrentUserId(Long.parseLong(userIdStr.trim()));
            } catch (NumberFormatException ignored) {
            }
        }

        try {
            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            UserContextHolder.clear();
        }
    }
}
