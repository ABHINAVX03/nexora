package com.abhinav.linkedin.posts_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostCommentedEvent {
    private Long postId;
    private Long commentId;
    private Long commenterId;
    private Long creatorId;
    private String commentContent;
}
