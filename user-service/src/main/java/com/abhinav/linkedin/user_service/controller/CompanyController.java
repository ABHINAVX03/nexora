package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.CompanyDto;
import com.abhinav.linkedin.user_service.service.CompanyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/search")
    public ResponseEntity<List<CompanyDto>> searchCompanies(@RequestParam(required = false) String query) {
        List<CompanyDto> companies = companyService.searchCompanies(query);
        return ResponseEntity.ok(companies);
    }
}
