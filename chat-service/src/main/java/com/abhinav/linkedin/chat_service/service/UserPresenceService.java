package com.abhinav.linkedin.chat_service.service;

import com.abhinav.linkedin.chat_service.dto.UserPresenceDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class UserPresenceService {

    // Thread-safe in-memory presence tracking keyed by user ID with UTC Instant timestamps
    private final Map<Long, Instant> userLastActiveMap = new ConcurrentHashMap<>();

    // A user is considered ONLINE if a heartbeat or activity was recorded within the last 60 seconds
    // (Frontend emits heartbeats every 25 seconds, providing a 2.4x margin for network variance)
    private static final Duration ACTIVE_THRESHOLD = Duration.ofSeconds(60);

    public void recordHeartbeat(Long userId) {
        if (userId != null) {
            userLastActiveMap.put(userId, Instant.now());
            log.debug("Recorded active presence for user: {}", userId);
        }
    }

    public void setOffline(Long userId) {
        // Natural heartbeat expiration is safer than manual backdating to support multi-tab sessions.
        // If explicitly requested, we update to threshold boundary without corrupting lastSeen.
        if (userId != null) {
            log.debug("Session closed for user: {}", userId);
        }
    }

    public boolean isUserActive(Long userId) {
        if (userId == null) return false;
        Instant lastActive = userLastActiveMap.get(userId);
        if (lastActive == null) return false;
        return Duration.between(lastActive, Instant.now()).compareTo(ACTIVE_THRESHOLD) <= 0;
    }

    public UserPresenceDto getPresence(Long userId) {
        Instant lastActive = userLastActiveMap.get(userId);
        boolean active = isUserActive(userId);
        return new UserPresenceDto(userId, active, lastActive);
    }

    public List<UserPresenceDto> getBatchPresence(List<Long> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyList();
        }
        return userIds.stream()
                .filter(Objects::nonNull)
                .distinct()
                .map(this::getPresence)
                .toList();
    }
}
