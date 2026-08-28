package com.abhinav.linkedin.user_service.utils;

import com.abhinav.linkedin.user_service.exception.BadRequestException;
import jakarta.servlet.http.HttpServletRequest;

public class UserContextUtil {

    public static Long extractUserId(HttpServletRequest request) {
        if (request == null) return null;
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            header = request.getHeader("X-UserId");
        }
        if (header != null && !header.isBlank()) {
            try {
                return Long.parseLong(header.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    public static Long requireUserId(HttpServletRequest request) {
        Long userId = extractUserId(request);
        if (userId == null) {
            throw new BadRequestException("Authentication required: missing user context");
        }
        return userId;
    }
}
