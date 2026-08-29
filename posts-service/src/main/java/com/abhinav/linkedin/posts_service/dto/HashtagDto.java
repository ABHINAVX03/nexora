package com.abhinav.linkedin.posts_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HashtagDto {
    private String tag;         // e.g. "leetcode"
    private String displayName; // e.g. "#leetcode"
    private long postCount;
}
