package com.abhinav.linkedin.user_service.dto;

import lombok.Data;

@Data
public class SignUpRequestDto {
    private String name;
    private String email;
    private String password;
}
