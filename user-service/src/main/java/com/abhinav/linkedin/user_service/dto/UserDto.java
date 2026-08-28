package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserDto {
    private Long id;
    private String name;
    private String email;
    private String headline;
    private String bio;
    private String location;
    private String avatarUrl;
    private String bannerUrl;
    private Boolean isEmailVerified = true;
}
