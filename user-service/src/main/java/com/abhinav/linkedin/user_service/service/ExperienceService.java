package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.ExperienceCreateRequestDto;
import com.abhinav.linkedin.user_service.dto.ExperienceDto;
import com.abhinav.linkedin.user_service.entity.Company;
import com.abhinav.linkedin.user_service.entity.Experience;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.user_service.repository.CompanyRepository;
import com.abhinav.linkedin.user_service.repository.ExperienceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExperienceService {

    private final ExperienceRepository experienceRepository;
    private final CompanyRepository companyRepository;

    public List<ExperienceDto> getExperiencesByUserId(Long userId) {
        return experienceRepository.findByUserIdOrderByIsCurrentlyWorkingDescStartDateDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ExperienceDto createExperience(Long userId, ExperienceCreateRequestDto req) {
        validateExperienceRequest(req);

        Company company = null;
        String finalCompanyName = req.getCompanyName();
        boolean isCustom = Boolean.TRUE.equals(req.getIsCustomCompany());

        if (req.getCompanyId() != null) {
            company = companyRepository.findById(req.getCompanyId()).orElse(null);
            if (company != null) {
                finalCompanyName = company.getName();
                isCustom = false;
            }
        }

        if (finalCompanyName == null || finalCompanyName.trim().isBlank()) {
            throw new BadRequestException("Company name is required");
        }

        LocalDate endDate = Boolean.TRUE.equals(req.getIsCurrentlyWorking()) ? null : req.getEndDate();

        Experience experience = Experience.builder()
                .userId(userId)
                .company(company)
                .companyName(finalCompanyName.trim())
                .isCustomCompany(isCustom)
                .title(req.getTitle().trim())
                .employmentType(req.getEmploymentType())
                .location(req.getLocation())
                .startDate(req.getStartDate())
                .endDate(endDate)
                .isCurrentlyWorking(Boolean.TRUE.equals(req.getIsCurrentlyWorking()))
                .description(req.getDescription())
                .skills(req.getSkills())
                .build();

        Experience saved = experienceRepository.save(experience);
        log.info("Created experience record {} for user {}", saved.getId(), userId);
        return mapToDto(saved);
    }

    @Transactional
    public ExperienceDto updateExperience(Long userId, Long experienceId, ExperienceCreateRequestDto req) {
        validateExperienceRequest(req);

        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + experienceId));

        if (!experience.getUserId().equals(userId)) {
            throw new BadRequestException("You are not authorized to edit this experience entry");
        }

        Company company = null;
        String finalCompanyName = req.getCompanyName();
        boolean isCustom = Boolean.TRUE.equals(req.getIsCustomCompany());

        if (req.getCompanyId() != null) {
            company = companyRepository.findById(req.getCompanyId()).orElse(null);
            if (company != null) {
                finalCompanyName = company.getName();
                isCustom = false;
            }
        }

        if (finalCompanyName == null || finalCompanyName.trim().isBlank()) {
            throw new BadRequestException("Company name is required");
        }

        LocalDate endDate = Boolean.TRUE.equals(req.getIsCurrentlyWorking()) ? null : req.getEndDate();

        experience.setCompany(company);
        experience.setCompanyName(finalCompanyName.trim());
        experience.setIsCustomCompany(isCustom);
        experience.setTitle(req.getTitle().trim());
        experience.setEmploymentType(req.getEmploymentType());
        experience.setLocation(req.getLocation());
        experience.setStartDate(req.getStartDate());
        experience.setEndDate(endDate);
        experience.setIsCurrentlyWorking(Boolean.TRUE.equals(req.getIsCurrentlyWorking()));
        experience.setDescription(req.getDescription());
        experience.setSkills(req.getSkills());

        Experience updated = experienceRepository.save(experience);
        log.info("Updated experience record {} for user {}", updated.getId(), userId);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteExperience(Long userId, Long experienceId) {
        Experience experience = experienceRepository.findById(experienceId)
                .orElseThrow(() -> new ResourceNotFoundException("Experience not found with id: " + experienceId));

        if (!experience.getUserId().equals(userId)) {
            throw new BadRequestException("You are not authorized to delete this experience entry");
        }

        experienceRepository.delete(experience);
        log.info("Deleted experience record {} for user {}", experienceId, userId);
    }

    private void validateExperienceRequest(ExperienceCreateRequestDto req) {
        if (req.getTitle() == null || req.getTitle().trim().isBlank()) {
            throw new BadRequestException("Job title is required");
        }
        if (req.getStartDate() == null) {
            throw new BadRequestException("Start date is required");
        }
        if (!Boolean.TRUE.equals(req.getIsCurrentlyWorking())) {
            if (req.getEndDate() == null) {
                throw new BadRequestException("End date is required for past roles");
            }
            if (req.getEndDate().isBefore(req.getStartDate())) {
                throw new BadRequestException("End date cannot be earlier than start date");
            }
        }
    }

    public ExperienceDto mapToDto(Experience exp) {
        String logoUrl = null;
        Long companyId = null;
        if (exp.getCompany() != null) {
            logoUrl = exp.getCompany().getLogoUrl();
            companyId = exp.getCompany().getId();
        }

        return ExperienceDto.builder()
                .id(exp.getId())
                .userId(exp.getUserId())
                .companyId(companyId)
                .companyName(exp.getCompanyName())
                .companyLogoUrl(logoUrl)
                .isCustomCompany(exp.getIsCustomCompany())
                .title(exp.getTitle())
                .employmentType(exp.getEmploymentType())
                .location(exp.getLocation())
                .startDate(exp.getStartDate())
                .endDate(exp.getEndDate())
                .isCurrentlyWorking(exp.getIsCurrentlyWorking())
                .description(exp.getDescription())
                .skills(exp.getSkills())
                .createdAt(exp.getCreatedAt())
                .build();
    }
}
