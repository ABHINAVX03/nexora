package com.abhinav.linkedin.posts_service.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PollDto {
    private Long id;
    private Long postId;
    private String question;
    private List<PollOptionDto> options;
    private Integer totalVotes;
    private Long userVotedOptionId;
    private Boolean hasVoted;
    private LocalDateTime createdAt;
}
