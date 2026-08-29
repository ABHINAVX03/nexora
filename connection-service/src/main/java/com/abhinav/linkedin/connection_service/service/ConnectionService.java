package com.abhinav.linkedin.connection_service.service;

import com.abhinav.linkedin.connection_service.entity.Person;
import com.abhinav.linkedin.connection_service.event.ConnectionAcceptedEvent;
import com.abhinav.linkedin.connection_service.event.ConnectionRequestEvent;
import com.abhinav.linkedin.connection_service.exception.BadRequestException;
import com.abhinav.linkedin.connection_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.connection_service.repository.PersonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ConnectionService {

    private final PersonRepository personRepository;
    private final KafkaTemplate<Long, Object> kafkaTemplate;

    @Value("${app.kafka.topics.connection-request:send-connection-request-topic}")
    private String connectionRequestTopic;

    @Value("${app.kafka.topics.connection-accepted:accept-connection-request-topic}")
    private String connectionAcceptedTopic;

    public List<Person> getFirstDegreeConnections(Long userId) {
        log.info("Getting first degree connections for user: {}", userId);
        return personRepository.getFirstDegreeConnections(userId);
    }

    public boolean areConnected(Long userId1, Long userId2) {
        if (userId1 == null || userId2 == null) {
            return false;
        }
        if (userId1.equals(userId2)) {
            return true;
        }
        return personRepository.areConnected(userId1, userId2);
    }

    public List<Person> getPendingRequests(Long userId) {
        log.info("Getting pending connection requests for user: {}", userId);
        return personRepository.getPendingRequests(userId);
    }

    public void sendConnectionRequest(Long senderId, Long receiverId) {
        log.info("Sending connection request from {} to {}", senderId, receiverId);

        if (senderId.equals(receiverId)) {
            throw new BadRequestException("You cannot send a connection request to yourself");
        }

        if (personRepository.areConnected(senderId, receiverId)) {
            throw new BadRequestException("You are already connected to this user");
        }

        if (personRepository.hasPendingRequest(senderId, receiverId)) {
            throw new BadRequestException("Connection request is already pending");
        }

        // Prevent cross-request collision
        if (personRepository.hasPendingRequest(receiverId, senderId)) {
            log.info("Cross connection request detected: auto-accepting connection between {} and {}", senderId, receiverId);
            acceptConnectionRequest(senderId, receiverId);
            return;
        }

        personRepository.sendConnectionRequest(senderId, receiverId);
        log.info("Saved connection request from {} to {}", senderId, receiverId);

        ConnectionRequestEvent event = ConnectionRequestEvent.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .senderName("User " + senderId)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            kafkaTemplate.send(connectionRequestTopic, receiverId, event);
            log.info("Published ConnectionRequestEvent to topic: {}", connectionRequestTopic);
        } catch (Exception e) {
            log.error("Failed to publish ConnectionRequestEvent to Kafka: {}", e.getMessage(), e);
        }
    }

    public void acceptConnectionRequest(Long receiverId, Long senderId) {
        log.info("User {} accepting connection request from {}", receiverId, senderId);

        if (!personRepository.hasPendingRequest(senderId, receiverId)) {
            throw new ResourceNotFoundException("No pending connection request found from user: " + senderId);
        }

        personRepository.acceptConnectionRequest(senderId, receiverId);
        log.info("Accepted connection request between {} and {}", senderId, receiverId);

        ConnectionAcceptedEvent event = ConnectionAcceptedEvent.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .receiverName("User " + receiverId)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            kafkaTemplate.send(connectionAcceptedTopic, senderId, event);
            log.info("Published ConnectionAcceptedEvent to topic: {}", connectionAcceptedTopic);
        } catch (Exception e) {
            log.error("Failed to publish ConnectionAcceptedEvent to Kafka: {}", e.getMessage(), e);
        }
    }

    public void rejectConnectionRequest(Long receiverId, Long senderId) {
        log.info("User {} rejecting connection request from {}", receiverId, senderId);

        if (!personRepository.hasPendingRequest(senderId, receiverId)) {
            throw new ResourceNotFoundException("No pending connection request found from user: " + senderId);
        }

        personRepository.rejectConnectionRequest(senderId, receiverId);
        log.info("Rejected connection request from {} to {}", senderId, receiverId);
    }

    public void cancelConnectionRequest(Long senderId, Long receiverId) {
        log.info("User {} cancelling outgoing connection request to {}", senderId, receiverId);

        if (!personRepository.hasPendingRequest(senderId, receiverId)) {
            throw new ResourceNotFoundException("No pending connection request found to user: " + receiverId);
        }

        personRepository.cancelConnectionRequest(senderId, receiverId);
        log.info("Cancelled connection request from {} to {}", senderId, receiverId);
    }

    public void removeConnection(Long userId1, Long userId2) {
        log.info("Removing 1st-degree connection between {} and {}", userId1, userId2);

        if (!personRepository.areConnected(userId1, userId2)) {
            throw new BadRequestException("You are not currently connected to this user");
        }

        personRepository.removeConnection(userId1, userId2);
        log.info("Removed connection between {} and {}", userId1, userId2);
    }
}
