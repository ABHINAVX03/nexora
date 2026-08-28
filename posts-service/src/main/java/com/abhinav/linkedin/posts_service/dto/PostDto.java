package com.abhinav.linkedin.posts_service.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostDto {
    private Long id;
    private String content;
    private String mediaUrl;
    private Long userId;
    private PollDto poll;
    private LocalDateTime createdAt;
}
