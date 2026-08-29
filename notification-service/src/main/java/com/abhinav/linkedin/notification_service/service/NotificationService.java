package com.abhinav.linkedin.notification_service.service;

import com.abhinav.linkedin.notification_service.dto.NotificationDto;
import com.abhinav.linkedin.notification_service.entity.Notification;
import com.abhinav.linkedin.notification_service.exception.ForbiddenException;
import com.abhinav.linkedin.notification_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.notification_service.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void sendNotification(Long userId, String message, String type) {
        sendNotification(userId, message, type, null);
    }

    public void sendNotification(Long userId, String message, String type, Long relatedEntityId) {
        log.info("Creating notification for user: {} with type: {} and relatedEntityId: {}", userId, type, relatedEntityId);

        Notification notification = Notification.builder()
                .userId(userId)
                .message(message)
                .type(type)
                .relatedEntityId(relatedEntityId)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Successfully persisted notification for userId: {}", userId);
    }

    public List<NotificationDto> getNotificationsForUser(Long userId) {
        log.info("Fetching notifications for user: {}", userId);
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notifications.stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public NotificationDto markAsRead(Long notificationId, Long userId) {
        log.info("Marking notification {} as read for user {}", notificationId, userId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        if (!notification.getUserId().equals(userId)) {
            throw new ForbiddenException("You are not authorized to access this notification");
        }

        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(java.time.LocalDateTime.now());
            notification = notificationRepository.save(notification);
        }

        return mapToDto(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        notificationRepository.markAllAsReadByUserId(userId);
    }

    private NotificationDto mapToDto(Notification notification) {
        return NotificationDto.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .message(notification.getMessage())
                .type(notification.getType())
                .isRead(notification.isRead())
                .readAt(notification.getReadAt())
                .relatedEntityId(notification.getRelatedEntityId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
