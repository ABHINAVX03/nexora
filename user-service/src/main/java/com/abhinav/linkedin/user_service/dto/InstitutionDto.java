package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstitutionDto {
    private Long id;
    private String name;
    private String shortName;
    private String logoUrl;
    private String location;
}
