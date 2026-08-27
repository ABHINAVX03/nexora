package com.abhinav.linkedin.notification_service.consumer;

import com.abhinav.linkedin.notification_service.client.ConnectionClient;
import com.abhinav.linkedin.notification_service.dto.PersonDto;
import com.abhinav.linkedin.notification_service.event.*;
import com.abhinav.linkedin.notification_service.service.NotificationService;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostServiceConsumer {

    private final ConnectionClient connectionClient;
    private final NotificationService notificationService;

    @KafkaListener(
            topics = "${app.kafka.topics.post-created:post-created-topic}",
            groupId = "${spring.kafka.consumer.group-id:notification-group}",
            properties = {"spring.json.value.default.type=com.abhinav.linkedin.notification_service.event.PostCreatedEvent"}
    )
    public void handlePostCreatedEvent(PostCreatedEvent postCreatedEvent) {
        log.info("Received PostCreatedEvent: {}", postCreatedEvent);

        if (postCreatedEvent == null || postCreatedEvent.getCreatorId() == null) {
            log.warn("Invalid PostCreatedEvent received: null payload or creatorId");
            return;
        }

        try {
            List<PersonDto> connections = fetchFirstDegreeConnections(postCreatedEvent.getCreatorId());
            if (connections != null && !connections.isEmpty()) {
                String snippet = postCreatedEvent.getContent() != null && postCreatedEvent.getContent().length() > 30
                        ? postCreatedEvent.getContent().substring(0, 30) + "..."
                        : (postCreatedEvent.getContent() != null ? postCreatedEvent.getContent() : "new update");

                for (PersonDto connection : connections) {
                    if (connection.getUserId() != null && !connection.getUserId().equals(postCreatedEvent.getCreatorId())) {
                        String message = "Your connection (User #" + postCreatedEvent.getCreatorId() + ") shared a post: \"" + snippet + "\"";
                        log.info("Sending post created notification to connection: {}", connection.getUserId());
                        notificationService.sendNotification(connection.getUserId(), message, "POST_CREATED");
                    }
                }
            } else {
                log.info("No 1st-degree connections found for creator: {}", postCreatedEvent.getCreatorId());
            }
        } catch (Exception e) {
            log.error("Failed to process PostCreatedEvent for postId: {}. Error: {}", postCreatedEvent.getPostId(), e.getMessage(), e);
        }
    }

    @CircuitBreaker(name = "connectionService", fallbackMethod = "fetchConnectionsFallback")
    public List<PersonDto> fetchFirstDegreeConnections(Long creatorId) {
        return connectionClient.getFirstDegreeConnections(creatorId);
    }

    public List<PersonDto> fetchConnectionsFallback(Long creatorId, Throwable throwable) {
        log.error("Circuit breaker fallback triggered for fetchFirstDegreeConnections({}). Reason: {}",
                creatorId, throwable.getMessage());
        return Collections.emptyList();
    }

    @KafkaListener(
            topics = "${app.kafka.topics.post-liked:post-liked-topic}",
            groupId = "${spring.kafka.consumer.group-id:notification-group}",
            properties = {"spring.json.value.default.type=com.abhinav.linkedin.notification_service.event.PostLikedEvent"}
    )
    public void handlePostLikedEvent(PostLikedEvent postLikedEvent) {
        log.info("Received PostLikedEvent: {}", postLikedEvent);

        if (postLikedEvent == null || postLikedEvent.getCreatorId() == null || postLikedEvent.getLikedByUserId() == null) {
            log.warn("Invalid PostLikedEvent received");
            return;
        }

        // Do not notify if a user likes their own post
        if (postLikedEvent.getLikedByUserId().equals(postLikedEvent.getCreatorId())) {
            log.debug("Skipping self-like notification for user: {}", postLikedEvent.getCreatorId());
            return;
        }

        String message = "User " + postLikedEvent.getLikedByUserId() + " liked your post.";
        notificationService.sendNotification(postLikedEvent.getCreatorId(), message, "POST_LIKED");
    }

    @KafkaListener(
            topics = "${app.kafka.topics.post-commented:post-commented-topic}",
            groupId = "${spring.kafka.consumer.group-id:notification-group}",
            properties = {"spring.json.value.default.type=com.abhinav.linkedin.notification_service.event.PostCommentedEvent"}
    )
    public void handlePostCommentedEvent(PostCommentedEvent event) {
        log.info("Received PostCommentedEvent: {}", event);

        if (event == null || event.getCreatorId() == null || event.getCommenterId() == null) {
            log.warn("Invalid PostCommentedEvent received");
            return;
        }

        if (event.getCommenterId().equals(event.getCreatorId())) {
            return;
        }

        String snippet = event.getCommentContent() != null && event.getCommentContent().length() > 30
            ? event.getCommentContent().substring(0, 30) + "..."
            : event.getCommentContent();
        String message = "User " + event.getCommenterId() + " commented: \"" + snippet + "\"";
        notificationService.sendNotification(event.getCreatorId(), message, "POST_COMMENTED");
    }

    @KafkaListener(
            topics = "${app.kafka.topics.connection-request:send-connection-request-topic}",
            groupId = "${spring.kafka.consumer.group-id:notification-group}",
            properties = {"spring.json.value.default.type=com.abhinav.linkedin.notification_service.event.ConnectionRequestEvent"}
    )
    public void handleConnectionRequestEvent(ConnectionRequestEvent event) {
        log.info("Received ConnectionRequestEvent: {}", event);

        if (event == null || event.getReceiverId() == null || event.getSenderId() == null) {
            log.warn("Invalid ConnectionRequestEvent received");
            return;
        }

        String message = "User " + event.getSenderId() + " sent you a connection request.";
        notificationService.sendNotification(event.getReceiverId(), message, "CONNECTION_REQUEST");
    }

    @KafkaListener(
            topics = "${app.kafka.topics.connection-accepted:accept-connection-request-topic}",
            groupId = "${spring.kafka.consumer.group-id:notification-group}",
            properties = {"spring.json.value.default.type=com.abhinav.linkedin.notification_service.event.ConnectionAcceptedEvent"}
    )
    public void handleConnectionAcceptedEvent(ConnectionAcceptedEvent event) {
        log.info("Received ConnectionAcceptedEvent: {}", event);

        if (event == null || event.getReceiverId() == null || event.getSenderId() == null) {
            log.warn("Invalid ConnectionAcceptedEvent received");
            return;
        }

        String message = "User " + event.getReceiverId() + " accepted your connection request.";
        notificationService.sendNotification(event.getSenderId(), message, "CONNECTION_ACCEPTED");
    }

    @KafkaListener(
            topics = "${app.kafka.topics.profile-viewed:profile-viewed-topic}",
            groupId = "${spring.kafka.consumer.group-id:notification-group}",
            properties = {"spring.json.value.default.type=com.abhinav.linkedin.notification_service.event.ProfileViewedEvent"}
    )
    public void handleProfileViewedEvent(ProfileViewedEvent event) {
        log.info("Received ProfileViewedEvent: {}", event);

        if (event == null || event.getViewedUserId() == null || event.getViewerId() == null) {
            log.warn("Invalid ProfileViewedEvent received");
            return;
        }

        if (event.getViewerId().equals(event.getViewedUserId())) {
            return;
        }

        String viewerName = event.getViewerName() != null && !event.getViewerName().isBlank()
                ? event.getViewerName()
                : "User #" + event.getViewerId();
        String message = viewerName + " viewed your profile.";
        notificationService.sendNotification(event.getViewedUserId(), message, "PROFILE_VIEWED");
    }
}
