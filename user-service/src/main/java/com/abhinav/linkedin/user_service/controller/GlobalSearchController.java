package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.CompanyDto;
import com.abhinav.linkedin.user_service.dto.SearchSuggestionsDto;
import com.abhinav.linkedin.user_service.dto.SearchUserDto;
import com.abhinav.linkedin.user_service.dto.SkillDto;
import com.abhinav.linkedin.user_service.service.GlobalSearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class GlobalSearchController {

    private final GlobalSearchService globalSearchService;

    @GetMapping("/search")
    public ResponseEntity<List<SearchUserDto>> searchPeople(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String company,
            @RequestParam(required = false) String skill,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        List<SearchUserDto> results = globalSearchService.searchPeople(
                searchQuery, location, company, skill, page, size
        );
        return ResponseEntity.ok(results);
    }

    @GetMapping("/search/suggestions")
    public ResponseEntity<SearchSuggestionsDto> getSearchSuggestions(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query
    ) {
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        SearchSuggestionsDto suggestions = globalSearchService.getSuggestions(searchQuery);
        return ResponseEntity.ok(suggestions);
    }

    @GetMapping("/companies/search/advanced")
    public ResponseEntity<List<CompanyDto>> searchCompaniesAdvanced(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String industry,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        List<CompanyDto> results = globalSearchService.searchCompaniesAdvanced(
                searchQuery, industry, page, size
        );
        return ResponseEntity.ok(results);
    }

    @GetMapping("/skills/search/advanced")
    public ResponseEntity<List<SkillDto>> searchSkillsAdvanced(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        List<SkillDto> results = globalSearchService.searchSkillsAdvanced(
                searchQuery, page, size
        );
        return ResponseEntity.ok(results);
    }
}
