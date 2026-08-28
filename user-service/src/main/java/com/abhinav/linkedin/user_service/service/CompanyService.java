package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.CompanyDto;
import com.abhinav.linkedin.user_service.entity.Company;
import com.abhinav.linkedin.user_service.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyService {

    private final CompanyRepository companyRepository;

    public List<CompanyDto> searchCompanies(String query) {
        if (query == null || query.trim().isBlank()) {
            return companyRepository.findAll(PageRequest.of(0, 15)).stream()
                    .map(this::mapToDto)
                    .collect(Collectors.toList());
        }

        String trimmed = query.trim();
        List<Company> companies = companyRepository.searchCompanies(trimmed, PageRequest.of(0, 15));
        return companies.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    public CompanyDto mapToDto(Company c) {
        return CompanyDto.builder()
                .id(c.getId())
                .name(c.getName())
                .domain(c.getDomain())
                .logoUrl(c.getLogoUrl())
                .industry(c.getIndustry())
                .location(c.getLocation())
                .build();
    }
}
