package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.InstitutionDto;
import com.abhinav.linkedin.user_service.service.InstitutionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/users/institutions")
@RequiredArgsConstructor
public class InstitutionController {

    private final InstitutionService institutionService;

    @GetMapping("/search")
    public ResponseEntity<List<InstitutionDto>> searchInstitutions(@RequestParam(required = false) String query) {
        List<InstitutionDto> institutions = institutionService.searchInstitutions(query);
        return ResponseEntity.ok(institutions);
    }
}
