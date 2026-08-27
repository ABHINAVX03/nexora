package com.abhinav.linkedin.connection_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConnectionAcceptedEvent {
    private Long senderId;
    private Long receiverId;
    private String receiverName;
    private LocalDateTime createdAt;
}
