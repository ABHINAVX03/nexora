package com.abhinav.linkedin.chat_service.service;

import com.abhinav.linkedin.chat_service.dto.UserPresenceDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class UserPresenceService {

    private final Map<Long, LocalDateTime> userLastActiveMap = new ConcurrentHashMap<>();
    private static final Duration ACTIVE_THRESHOLD = Duration.ofMinutes(2);

    public void recordHeartbeat(Long userId) {
        if (userId != null) {
            userLastActiveMap.put(userId, LocalDateTime.now());
        }
    }

    public void setOffline(Long userId) {
        if (userId != null) {
            userLastActiveMap.put(userId, LocalDateTime.now().minusMinutes(10));
        }
    }

    public boolean isUserActive(Long userId) {
        if (userId == null) return false;
        LocalDateTime lastActive = userLastActiveMap.get(userId);
        if (lastActive == null) return false;
        return Duration.between(lastActive, LocalDateTime.now()).compareTo(ACTIVE_THRESHOLD) <= 0;
    }

    public UserPresenceDto getPresence(Long userId) {
        LocalDateTime lastActive = userLastActiveMap.get(userId);
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
