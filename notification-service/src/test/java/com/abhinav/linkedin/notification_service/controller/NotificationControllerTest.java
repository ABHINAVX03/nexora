package com.abhinav.linkedin.notification_service.controller;

import com.abhinav.linkedin.notification_service.auth.UserContextFilter;
import com.abhinav.linkedin.notification_service.dto.NotificationDto;
import com.abhinav.linkedin.notification_service.exception.GlobalExceptionHandler;
import com.abhinav.linkedin.notification_service.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class NotificationControllerTest {

    private MockMvc mockMvc;
    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = Mockito.mock(NotificationService.class);
        NotificationController controller = new NotificationController(notificationService);

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new UserContextFilter())
                .build();
    }

    @Test
    void testGetNotifications_withHeader_returnsList() throws Exception {
        NotificationDto dto = NotificationDto.builder()
                .id(1L)
                .userId(100L)
                .message("Test notification")
                .type("POST_CREATED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        when(notificationService.getNotificationsForUser(100L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/notifications")
                        .header("X-User-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].message").value("Test notification"));
    }

    @Test
    void testGetUnreadCount_withHeader_returnsCount() throws Exception {
        when(notificationService.getUnreadCount(100L)).thenReturn(3L);

        mockMvc.perform(get("/notifications/unread-count")
                        .header("X-User-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(3));
    }

    @Test
    void testMarkAsRead_withHeader_returnsUpdatedDto() throws Exception {
        NotificationDto dto = NotificationDto.builder()
                .id(1L)
                .userId(100L)
                .message("Test notification")
                .type("POST_CREATED")
                .isRead(true)
                .build();

        when(notificationService.markAsRead(1L, 100L)).thenReturn(dto);

        mockMvc.perform(patch("/notifications/1/read")
                        .header("X-User-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isRead").value(true));
    }

    @Test
    void testMarkAllAsRead_withHeader_returnsOk() throws Exception {
        doNothing().when(notificationService).markAllAsRead(100L);

        mockMvc.perform(patch("/notifications/read-all")
                        .header("X-User-Id", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));
    }
}
