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
public class SearchUserDto {
    private Long id;
    private String name;
    private String email;
    private String headline;
    private String bio;
    private String location;
    private String avatarUrl;
    private String bannerUrl;
    private String currentCompany;
    private String currentTitle;
    private List<String> skills;
    private int relevanceScore;
}
