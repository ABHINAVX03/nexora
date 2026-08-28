package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.EducationCreateRequestDto;
import com.abhinav.linkedin.user_service.dto.EducationDto;
import com.abhinav.linkedin.user_service.entity.EducationalInstitution;
import com.abhinav.linkedin.user_service.entity.Education;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.user_service.repository.EducationalInstitutionRepository;
import com.abhinav.linkedin.user_service.repository.EducationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EducationService {

    private final EducationRepository educationRepository;
    private final EducationalInstitutionRepository institutionRepository;

    public List<EducationDto> getEducationsByUserId(Long userId) {
        return educationRepository.findByUserIdOrderByStartYearDesc(userId)
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public EducationDto createEducation(Long userId, EducationCreateRequestDto req) {
        validateEducationRequest(req);

        EducationalInstitution institution = null;
        String finalInstitutionName = req.getInstitutionName();
        boolean isCustom = Boolean.TRUE.equals(req.getIsCustomInstitution());

        if (req.getInstitutionId() != null) {
            institution = institutionRepository.findById(req.getInstitutionId()).orElse(null);
            if (institution != null) {
                finalInstitutionName = institution.getName();
                isCustom = false;
            }
        }

        if (finalInstitutionName == null || finalInstitutionName.trim().isBlank()) {
            throw new BadRequestException("Institution / University name is required");
        }

        Education education = Education.builder()
                .userId(userId)
                .institution(institution)
                .institutionName(finalInstitutionName.trim())
                .isCustomInstitution(isCustom)
                .degree(req.getDegree().trim())
                .fieldOfStudy(req.getFieldOfStudy())
                .startYear(req.getStartYear())
                .endYear(req.getEndYear())
                .grade(req.getGrade())
                .description(req.getDescription())
                .build();

        Education saved = educationRepository.save(education);
        log.info("Created education record {} for user {}", saved.getId(), userId);
        return mapToDto(saved);
    }

    @Transactional
    public EducationDto updateEducation(Long userId, Long educationId, EducationCreateRequestDto req) {
        validateEducationRequest(req);

        Education education = educationRepository.findById(educationId)
                .orElseThrow(() -> new ResourceNotFoundException("Education not found with id: " + educationId));

        if (!education.getUserId().equals(userId)) {
            throw new BadRequestException("You are not authorized to edit this education entry");
        }

        EducationalInstitution institution = null;
        String finalInstitutionName = req.getInstitutionName();
        boolean isCustom = Boolean.TRUE.equals(req.getIsCustomInstitution());

        if (req.getInstitutionId() != null) {
            institution = institutionRepository.findById(req.getInstitutionId()).orElse(null);
            if (institution != null) {
                finalInstitutionName = institution.getName();
                isCustom = false;
            }
        }

        if (finalInstitutionName == null || finalInstitutionName.trim().isBlank()) {
            throw new BadRequestException("Institution / University name is required");
        }

        education.setInstitution(institution);
        education.setInstitutionName(finalInstitutionName.trim());
        education.setIsCustomInstitution(isCustom);
        education.setDegree(req.getDegree().trim());
        education.setFieldOfStudy(req.getFieldOfStudy());
        education.setStartYear(req.getStartYear());
        education.setEndYear(req.getEndYear());
        education.setGrade(req.getGrade());
        education.setDescription(req.getDescription());

        Education updated = educationRepository.save(education);
        log.info("Updated education record {} for user {}", updated.getId(), userId);
        return mapToDto(updated);
    }

    @Transactional
    public void deleteEducation(Long userId, Long educationId) {
        Education education = educationRepository.findById(educationId)
                .orElseThrow(() -> new ResourceNotFoundException("Education not found with id: " + educationId));

        if (!education.getUserId().equals(userId)) {
            throw new BadRequestException("You are not authorized to delete this education entry");
        }

        educationRepository.delete(education);
        log.info("Deleted education record {} for user {}", educationId, userId);
    }

    private void validateEducationRequest(EducationCreateRequestDto req) {
        if (req.getDegree() == null || req.getDegree().trim().isBlank()) {
            throw new BadRequestException("Degree is required (e.g. Bachelor of Technology)");
        }
        if (req.getStartYear() == null) {
            throw new BadRequestException("Start year is required");
        }
        if (req.getEndYear() != null && req.getEndYear() < req.getStartYear()) {
            throw new BadRequestException("Graduation year cannot be earlier than start year");
        }
    }

    public EducationDto mapToDto(Education edu) {
        String logoUrl = null;
        String shortName = null;
        Long institutionId = null;

        if (edu.getInstitution() != null) {
            logoUrl = edu.getInstitution().getLogoUrl();
            shortName = edu.getInstitution().getShortName();
            institutionId = edu.getInstitution().getId();
        }

        return EducationDto.builder()
                .id(edu.getId())
                .userId(edu.getUserId())
                .institutionId(institutionId)
                .institutionName(edu.getInstitutionName())
                .institutionShortName(shortName)
                .institutionLogoUrl(logoUrl)
                .isCustomInstitution(edu.getIsCustomInstitution())
                .degree(edu.getDegree())
                .fieldOfStudy(edu.getFieldOfStudy())
                .startYear(edu.getStartYear())
                .endYear(edu.getEndYear())
                .grade(edu.getGrade())
                .description(edu.getDescription())
                .createdAt(edu.getCreatedAt())
                .build();
    }
}
