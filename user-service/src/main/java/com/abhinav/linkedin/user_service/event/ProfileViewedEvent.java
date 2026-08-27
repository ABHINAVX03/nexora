package com.abhinav.linkedin.user_service.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProfileViewedEvent {
    private Long viewerId;
    private Long viewedUserId;
    private String viewerName;
}
