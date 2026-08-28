package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EndorserSummaryDto {
    private Long id;
    private Long userId;
    private String name;
    private String headline;
    private String avatarUrl;
    private LocalDateTime endorsedAt;
}
