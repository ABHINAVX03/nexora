package com.abhinav.linkedin.chat_service.controller;

import com.abhinav.linkedin.chat_service.dto.ChatMessageDto;
import com.abhinav.linkedin.chat_service.dto.SendMessageRequestDto;
import com.abhinav.linkedin.chat_service.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void handleChatMessage(
            @Payload SendMessageRequestDto messageRequest,
            @Header(name = "userId", required = false) String userIdHeader
    ) {
        log.info("Received WebSocket chat message: {}", messageRequest);

        Long senderId = null;
        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                senderId = Long.parseLong(userIdHeader.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        if (senderId != null && messageRequest.getRecipientId() != null) {
            chatService.sendMessage(senderId, messageRequest.getRecipientId(), messageRequest.getContent());
        }
    }
}
