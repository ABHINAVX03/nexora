package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileUpdateRequestDto {
    private String name;
    private String headline;
    private String bio;
    private String location;
    private String avatarUrl;
}
