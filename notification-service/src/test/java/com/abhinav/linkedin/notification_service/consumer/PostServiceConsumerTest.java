package com.abhinav.linkedin.notification_service.consumer;

import com.abhinav.linkedin.notification_service.client.ConnectionClient;
import com.abhinav.linkedin.notification_service.dto.PersonDto;
import com.abhinav.linkedin.notification_service.event.ConnectionAcceptedEvent;
import com.abhinav.linkedin.notification_service.event.ConnectionRequestEvent;
import com.abhinav.linkedin.notification_service.event.PostCreatedEvent;
import com.abhinav.linkedin.notification_service.event.PostLikedEvent;
import com.abhinav.linkedin.notification_service.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceConsumerTest {

    @Mock
    private ConnectionClient connectionClient;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private PostServiceConsumer consumer;

    @Test
    void handlePostCreatedEvent_notifiesFirstDegreeConnections() {
        PostCreatedEvent event = PostCreatedEvent.builder()
                .postId(10L)
                .creatorId(1L)
                .content("Hello World")
                .build();

        PersonDto connection = PersonDto.builder().userId(2L).username("User 2").build();
        when(connectionClient.getFirstDegreeConnections(1L)).thenReturn(List.of(connection));

        consumer.handlePostCreatedEvent(event);

        verify(notificationService).sendNotification(eq(2L), contains("created a new post"), eq("POST_CREATED"));
    }

    @Test
    void handlePostLikedEvent_differentUser_sendsNotification() {
        PostLikedEvent event = PostLikedEvent.builder()
                .postId(10L)
                .creatorId(1L)
                .likedByUserId(2L)
                .build();

        consumer.handlePostLikedEvent(event);

        verify(notificationService).sendNotification(eq(1L), contains("User 2 liked your post"), eq("POST_LIKED"));
    }

    @Test
    void handlePostLikedEvent_selfLike_doesNotSendNotification() {
        PostLikedEvent event = PostLikedEvent.builder()
                .postId(10L)
                .creatorId(1L)
                .likedByUserId(1L)
                .build();

        consumer.handlePostLikedEvent(event);

        verify(notificationService, never()).sendNotification(any(), any(), any());
    }

    @Test
    void handleConnectionRequestEvent_sendsNotificationToReceiver() {
        ConnectionRequestEvent event = ConnectionRequestEvent.builder()
                .senderId(1L)
                .receiverId(2L)
                .senderName("User 1")
                .createdAt(LocalDateTime.now())
                .build();

        consumer.handleConnectionRequestEvent(event);

        verify(notificationService).sendNotification(eq(2L), contains("User 1 sent you a connection request"), eq("CONNECTION_REQUEST"));
    }

    @Test
    void handleConnectionAcceptedEvent_sendsNotificationToSender() {
        ConnectionAcceptedEvent event = ConnectionAcceptedEvent.builder()
                .senderId(1L)
                .receiverId(2L)
                .receiverName("User 2")
                .createdAt(LocalDateTime.now())
                .build();

        consumer.handleConnectionAcceptedEvent(event);

        verify(notificationService).sendNotification(eq(1L), contains("User 2 accepted your connection request"), eq("CONNECTION_ACCEPTED"));
    }

    @Test
    void fetchConnectionsFallback_returnsEmptyList() {
        List<PersonDto> fallbackConnections = consumer.fetchConnectionsFallback(1L, new RuntimeException("Service down"));
        assertNotNull(fallbackConnections);
        assertTrue(fallbackConnections.isEmpty());
    }
}
