package com.abhinav.linkedin.notification_service.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private Long userId;
    private String message;
    private String type;

    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime createdAt;
}
