package com.abhinav.linkedin.notification_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostCreatedEvent {
    private Long creatorId;
    private Long postId;
    private String content;
}
