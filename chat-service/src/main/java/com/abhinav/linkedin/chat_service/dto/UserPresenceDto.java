package com.abhinav.linkedin.chat_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserPresenceDto {
    private Long userId;
    private boolean isActive;
    private LocalDateTime lastActiveAt;
}
