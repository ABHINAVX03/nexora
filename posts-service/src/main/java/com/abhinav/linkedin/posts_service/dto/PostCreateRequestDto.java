package com.abhinav.linkedin.posts_service.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PostCreateRequestDto {

    @NotBlank(message = "Post content cannot be empty")
    private String content;

    private String mediaUrl;

    private PollCreateRequestDto poll;
}
