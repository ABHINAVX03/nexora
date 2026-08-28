package com.abhinav.linkedin.user_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSkillDto {
    private Long id;
    private Long userId;
    private Long skillId;
    private String skillName;
    private String category;
    private Integer endorsementCount;
    private Boolean isEndorsedByViewer;
    @Builder.Default
    private List<EndorserSummaryDto> topEndorsers = new ArrayList<>();
    private Integer displayOrder;
}
