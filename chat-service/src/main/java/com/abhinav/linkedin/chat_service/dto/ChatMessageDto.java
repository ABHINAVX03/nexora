package com.abhinav.linkedin.chat_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChatMessageDto {
    private Long id;
    private Long senderId;
    private Long recipientId;
    private String content;
    private boolean isRead;
    private LocalDateTime createdAt;
}
