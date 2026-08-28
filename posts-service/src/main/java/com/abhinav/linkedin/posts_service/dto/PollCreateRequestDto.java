package com.abhinav.linkedin.posts_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollCreateRequestDto {

    @NotBlank(message = "Poll question cannot be empty")
    private String question;

    @Size(min = 2, max = 5, message = "Poll must contain between 2 and 5 options")
    private List<String> options;
}
