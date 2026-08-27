package com.abhinav.linkedin.posts_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostLikedEvent {
    private Long postId;
    private Long creatorId;
    private Long likedByUserId;
}

