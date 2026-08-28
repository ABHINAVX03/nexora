package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationDto {
    private Long id;
    private Long userId;
    private Long institutionId;
    private String institutionName;
    private String institutionShortName;
    private String institutionLogoUrl;
    private Boolean isCustomInstitution;
    private String degree;
    private String fieldOfStudy;
    private Integer startYear;
    private Integer endYear;
    private String grade;
    private String description;
    private LocalDateTime createdAt;
}
