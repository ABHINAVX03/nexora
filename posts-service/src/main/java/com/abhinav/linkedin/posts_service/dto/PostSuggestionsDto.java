package com.abhinav.linkedin.posts_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostSuggestionsDto {
    private List<HashtagDto> hashtags;
    private List<PostSnippetDto> posts;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PostSnippetDto {
        private Long id;
        private Long userId;
        private String contentSnippet;
        private String mediaUrl;
    }
}
