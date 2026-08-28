package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperienceDto {
    private Long id;
    private Long userId;
    private Long companyId;
    private String companyName;
    private String companyLogoUrl;
    private Boolean isCustomCompany;
    private String title;
    private String employmentType;
    private String location;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isCurrentlyWorking;
    private String description;
    private String skills;
    private LocalDateTime createdAt;
}
