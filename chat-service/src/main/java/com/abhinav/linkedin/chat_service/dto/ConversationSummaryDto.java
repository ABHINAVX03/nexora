package com.abhinav.linkedin.chat_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConversationSummaryDto {
    private Long otherUserId;
    private String lastMessage;
    private LocalDateTime lastMessageTime;
    private long unreadCount;
    private boolean isPartnerActive;
    private LocalDateTime partnerLastSeen;
}
