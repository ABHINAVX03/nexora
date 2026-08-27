package com.abhinav.linkedin.notification_service.service;

import com.abhinav.linkedin.notification_service.dto.NotificationDto;
import com.abhinav.linkedin.notification_service.entity.Notification;
import com.abhinav.linkedin.notification_service.exception.ForbiddenException;
import com.abhinav.linkedin.notification_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.notification_service.repository.NotificationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private NotificationService notificationService;

    @Test
    void sendNotification_persistsNotification() {
        notificationService.sendNotification(100L, "Test Message", "POST_CREATED");

        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());

        Notification saved = captor.getValue();
        assertEquals(100L, saved.getUserId());
        assertEquals("Test Message", saved.getMessage());
        assertEquals("POST_CREATED", saved.getType());
        assertFalse(saved.isRead());
    }

    @Test
    void getNotificationsForUser_returnsDtos() {
        Notification notification = Notification.builder()
                .id(1L)
                .userId(100L)
                .message("Test")
                .type("POST_CREATED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationRepository.findByUserIdOrderByCreatedAtDesc(100L)).thenReturn(List.of(notification));

        List<NotificationDto> result = notificationService.getNotificationsForUser(100L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
        assertEquals("Test", result.get(0).getMessage());
    }

    @Test
    void getUnreadCount_returnsCount() {
        when(notificationRepository.countByUserIdAndIsReadFalse(100L)).thenReturn(5L);

        long count = notificationService.getUnreadCount(100L);

        assertEquals(5L, count);
    }

    @Test
    void markAsRead_byOwner_success() {
        Notification notification = Notification.builder()
                .id(1L)
                .userId(100L)
                .isRead(false)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class))).thenAnswer(inv -> inv.getArgument(0));

        NotificationDto result = notificationService.markAsRead(1L, 100L);

        assertTrue(result.isRead());
        verify(notificationRepository).save(notification);
    }

    @Test
    void markAsRead_byOtherUser_throwsForbidden() {
        Notification notification = Notification.builder()
                .id(1L)
                .userId(100L)
                .build();

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(notification));

        assertThrows(ForbiddenException.class, () -> notificationService.markAsRead(1L, 200L));
    }

    @Test
    void markAsRead_notFound_throwsResourceNotFound() {
        when(notificationRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> notificationService.markAsRead(99L, 100L));
    }

    @Test
    void markAllAsRead_callsRepo() {
        notificationService.markAllAsRead(100L);
        verify(notificationRepository).markAllAsReadByUserId(100L);
    }
}
