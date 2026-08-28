package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.InstitutionDto;
import com.abhinav.linkedin.user_service.entity.EducationalInstitution;
import com.abhinav.linkedin.user_service.repository.EducationalInstitutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstitutionService {

    private final EducationalInstitutionRepository institutionRepository;

    public List<InstitutionDto> searchInstitutions(String query) {
        if (query == null || query.trim().isBlank()) {
            return institutionRepository.findAll(PageRequest.of(0, 15)).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        String trimmed = query.trim();
        List<EducationalInstitution> institutions = institutionRepository.searchInstitutions(trimmed, PageRequest.of(0, 15));
        return institutions.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public InstitutionDto mapToDto(EducationalInstitution inst) {
        return InstitutionDto.builder()
                .id(inst.getId())
                .name(inst.getName())
                .shortName(inst.getShortName())
                .logoUrl(inst.getLogoUrl())
                .location(inst.getLocation())
                .build();
    }
}
