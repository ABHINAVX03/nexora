package com.abhinav.linkedin.notification_service.controller;

import com.abhinav.linkedin.notification_service.auth.UserContextHolder;
import com.abhinav.linkedin.notification_service.dto.NotificationDto;
import com.abhinav.linkedin.notification_service.exception.BadRequestException;
import com.abhinav.linkedin.notification_service.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/notifications", "/core"})
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private Long extractUserId(HttpServletRequest request) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null && request != null) {
            String header = request.getHeader("X-User-Id");
            if (header == null || header.isBlank()) {
                header = request.getHeader("X-UserId");
            }
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return userId;
    }

    private Long requireUserId(HttpServletRequest request) {
        Long userId = extractUserId(request);
        if (userId == null) {
            throw new BadRequestException("User ID is missing in request headers");
        }
        return userId;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(HttpServletRequest request) {
        Long userId = requireUserId(request);
        return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(HttpServletRequest request) {
        Long userId = requireUserId(request);
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDto> markAsRead(
            @PathVariable Long id,
            HttpServletRequest request) {

        Long userId = requireUserId(request);
        NotificationDto notification = notificationService.markAsRead(id, userId);
        return ResponseEntity.ok(notification);
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(HttpServletRequest request) {
        Long userId = requireUserId(request);
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
    }
}
