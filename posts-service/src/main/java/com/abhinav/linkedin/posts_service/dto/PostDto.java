package com.abhinav.linkedin.posts_service.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class PostDto {
    private Long id;
    private String content;
    private String mediaUrl;
    private List<String> mediaUrls = new java.util.ArrayList<>();
    private List<String> images = new java.util.ArrayList<>();
    private Long repostOfPostId;
    private PostDto repostedPost;
    private Long userId;
    private PollDto poll;
    private Integer likesCount = 0;
    private Integer commentsCount = 0;
    private Boolean hasLiked = false;
    private LocalDateTime createdAt;
}

