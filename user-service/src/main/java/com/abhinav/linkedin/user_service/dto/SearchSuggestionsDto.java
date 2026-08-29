package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchSuggestionsDto {
    private List<SearchPersonSuggestionDto> people;
    private List<SearchCompanySuggestionDto> companies;
    private List<SearchSkillSuggestionDto> skills;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchPersonSuggestionDto {
        private Long id;
        private String name;
        private String headline;
        private String avatarUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchCompanySuggestionDto {
        private Long id;
        private String name;
        private String logoUrl;
        private String industry;
        private long memberCount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchSkillSuggestionDto {
        private Long id;
        private String name;
        private String category;
        private long memberCount;
    }
}
