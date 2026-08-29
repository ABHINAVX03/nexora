package com.abhinav.linkedin.chat_service.service;

import com.abhinav.linkedin.chat_service.client.ConnectionClient;
import com.abhinav.linkedin.chat_service.dto.*;
import com.abhinav.linkedin.chat_service.entity.ChatMessage;
import com.abhinav.linkedin.chat_service.repository.ChatMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ConnectionClient connectionClient;
    private final ModelMapper modelMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserPresenceService userPresenceService;

    public ChatMessageDto sendMessage(Long senderId, Long recipientId, String content) {
        if (senderId == null || recipientId == null) {
            throw new IllegalArgumentException("Sender and recipient must not be null");
        }

        if (content == null || content.trim().isBlank()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        if (senderId.equals(recipientId)) {
            throw new IllegalArgumentException("Cannot chat with yourself");
        }

        // Record activity for sender
        userPresenceService.recordHeartbeat(senderId);

        // Verify 1st-degree connection
        try {
            Boolean connected = connectionClient.areConnected(recipientId);
            if (Boolean.FALSE.equals(connected)) {
                log.warn("Attempt to message non-1st-degree connection: sender={}, recipient={}", senderId, recipientId);
            }
        } catch (Exception e) {
            log.warn("Could not verify connection state with connection-service: {}", e.getMessage());
        }

        ChatMessage message = new ChatMessage();
        message.setSenderId(senderId);
        message.setRecipientId(recipientId);
        message.setContent(content.trim());
        message.setRead(false);

        ChatMessage saved = chatMessageRepository.save(message);
        ChatMessageDto dto = modelMapper.map(saved, ChatMessageDto.class);

        // Push real-time WebSocket notification
        try {
            messagingTemplate.convertAndSend("/topic/messages/" + recipientId, dto);
            messagingTemplate.convertAndSend("/topic/messages/" + senderId, dto);
            log.info("Delivered WebSocket message from {} to {}", senderId, recipientId);
        } catch (Exception e) {
            log.error("Failed to push STOMP message: {}", e.getMessage());
        }

        return dto;
    }

    public List<ChatMessageDto> getConversationHistory(Long user1, Long user2) {
        userPresenceService.recordHeartbeat(user1);
        List<ChatMessage> messages = chatMessageRepository.findConversationHistory(user1, user2);
        return messages.stream()
                .map(m -> modelMapper.map(m, ChatMessageDto.class))
                .collect(Collectors.toList());
    }

    public void markAsRead(Long senderId, Long recipientId) {
        userPresenceService.recordHeartbeat(recipientId);
        chatMessageRepository.markConversationAsRead(senderId, recipientId);
    }

    public long getUnreadCount(Long userId) {
        userPresenceService.recordHeartbeat(userId);
        return chatMessageRepository.countUnreadMessages(userId);
    }

    public List<ConversationSummaryDto> getConversations(Long userId) {
        userPresenceService.recordHeartbeat(userId);
        List<Long> partnerIds = chatMessageRepository.findDistinctPartnerIds(userId);
        List<ConversationSummaryDto> summaries = new ArrayList<>();

        for (Long partnerId : partnerIds) {
            Optional<ChatMessage> latestOpt = chatMessageRepository.findLatestMessageBetween(userId, partnerId);
            if (latestOpt.isPresent()) {
                ChatMessage last = latestOpt.get();
                long unread = chatMessageRepository.countUnreadBetween(partnerId, userId);
                UserPresenceDto partnerPresence = userPresenceService.getPresence(partnerId);

                summaries.add(new ConversationSummaryDto(
                        partnerId,
                        last.getContent(),
                        last.getCreatedAt(),
                        unread,
                        partnerPresence.isActive(),
                        partnerPresence.getLastActiveAt()
                ));
            }
        }

        summaries.sort((a, b) -> {
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        return summaries;
    }
}
