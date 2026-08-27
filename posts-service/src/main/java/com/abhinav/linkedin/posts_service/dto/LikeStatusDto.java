package com.abhinav.linkedin.posts_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LikeStatusDto {
    private Long postId;
    private boolean hasLiked;
    private long likesCount;
}
