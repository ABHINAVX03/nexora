package com.abhinav.linkedin.posts_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class PostCreateRequestDto {

    @NotBlank(message = "Post content cannot be empty")
    private String content;

    private String mediaUrl;

    private List<String> mediaUrls;

    private Long repostOfPostId;

    private PollCreateRequestDto poll;
}

