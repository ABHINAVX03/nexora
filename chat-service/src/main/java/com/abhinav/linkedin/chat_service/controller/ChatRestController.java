package com.abhinav.linkedin.chat_service.controller;

import com.abhinav.linkedin.chat_service.auth.UserContextHolder;
import com.abhinav.linkedin.chat_service.dto.*;
import com.abhinav.linkedin.chat_service.service.ChatService;
import com.abhinav.linkedin.chat_service.service.UserPresenceService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/chat", "/core/chat"})
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final UserPresenceService userPresenceService;

    private Long resolveUserId(HttpServletRequest request) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null) {
            String header = request.getHeader("X-User-Id");
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return userId;
    }

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @RequestBody SendMessageRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long senderId = resolveUserId(request);
        if (senderId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ChatMessageDto messageDto = chatService.sendMessage(
                senderId,
                requestDto.getRecipientId(),
                requestDto.getContent()
        );
        return new ResponseEntity<>(messageDto, HttpStatus.CREATED);
    }

    @GetMapping("/history/{otherUserId}")
    public ResponseEntity<List<ChatMessageDto>> getHistory(
            @PathVariable Long otherUserId,
            HttpServletRequest request
    ) {
        Long currentUserId = resolveUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ChatMessageDto> history = chatService.getConversationHistory(currentUserId, otherUserId);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationSummaryDto>> getConversations(HttpServletRequest request) {
        Long currentUserId = resolveUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ConversationSummaryDto> conversations = chatService.getConversations(currentUserId);
        return ResponseEntity.ok(conversations);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountDto> getUnreadCount(HttpServletRequest request) {
        Long currentUserId = resolveUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        long count = chatService.getUnreadCount(currentUserId);
        return ResponseEntity.ok(new UnreadCountDto(count));
    }

    @PatchMapping("/read/{otherUserId}")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long otherUserId,
            HttpServletRequest request
    ) {
        Long currentUserId = resolveUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        chatService.markAsRead(otherUserId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    // Presence & Online Status Endpoints
    @PostMapping("/presence/heartbeat")
    public ResponseEntity<UserPresenceDto> recordHeartbeat(HttpServletRequest request) {
        Long currentUserId = resolveUserId(request);
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        userPresenceService.recordHeartbeat(currentUserId);
        UserPresenceDto presence = userPresenceService.getPresence(currentUserId);
        return ResponseEntity.ok(presence);
    }

    @GetMapping("/presence/{userId}")
    public ResponseEntity<UserPresenceDto> getUserPresence(@PathVariable Long userId) {
        UserPresenceDto presence = userPresenceService.getPresence(userId);
        return ResponseEntity.ok(presence);
    }

    @PostMapping("/presence/batch")
    public ResponseEntity<List<UserPresenceDto>> getBatchPresence(@RequestBody BatchPresenceRequestDto requestDto) {
        List<UserPresenceDto> presences = userPresenceService.getBatchPresence(
                requestDto != null ? requestDto.getUserIds() : List.of()
        );
        return ResponseEntity.ok(presences);
    }
}
