package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.CompanyDto;
import com.abhinav.linkedin.user_service.dto.SearchSuggestionsDto;
import com.abhinav.linkedin.user_service.dto.SearchUserDto;
import com.abhinav.linkedin.user_service.dto.SkillDto;
import com.abhinav.linkedin.user_service.entity.*;
import com.abhinav.linkedin.user_service.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GlobalSearchService {

    private final UserRepository userRepository;
    private final ExperienceRepository experienceRepository;
    private final EducationRepository educationRepository;
    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final CompanyRepository companyRepository;
    private final ModelMapper modelMapper;

    public List<SearchUserDto> searchPeople(
            String query,
            String locationFilter,
            String companyFilter,
            String skillFilter,
            int page,
            int size
    ) {
        log.info("Executing advanced people search with query: '{}', location: '{}', company: '{}', skill: '{}'",
                query, locationFilter, companyFilter, skillFilter);

        String normalizedQuery = query != null ? query.trim().toLowerCase() : "";
        String[] queryTokens = normalizedQuery.isBlank() ? new String[0] : normalizedQuery.split("\\s+");

        List<User> allUsers = userRepository.findAll();
        if (allUsers.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> allUserIds = allUsers.stream().map(User::getId).collect(Collectors.toList());
        List<Experience> allExperiences = experienceRepository.findByUserIdIn(allUserIds);
        List<UserSkill> allUserSkills = userSkillRepository.findByUserIdIn(allUserIds);

        Map<Long, List<Experience>> expByUser = allExperiences.stream()
                .collect(Collectors.groupingBy(Experience::getUserId));
        Map<Long, List<UserSkill>> skillsByUser = allUserSkills.stream()
                .collect(Collectors.groupingBy(UserSkill::getUserId));

        List<SearchUserDto> scoredUsers = new ArrayList<>();

        for (User user : allUsers) {
            List<Experience> userExps = expByUser.getOrDefault(user.getId(), Collections.emptyList());
            List<UserSkill> userSkills = skillsByUser.getOrDefault(user.getId(), Collections.emptyList());

            List<String> skillNames = userSkills.stream()
                    .map(UserSkill::getSkillName)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());

            Experience currentExp = userExps.stream()
                    .filter(e -> Boolean.TRUE.equals(e.getIsCurrentlyWorking()))
                    .findFirst()
                    .orElse(userExps.isEmpty() ? null : userExps.get(0));

            String currentComp = currentExp != null ? currentExp.getCompanyName() : null;
            String currentTit = currentExp != null ? currentExp.getTitle() : null;

            // Apply explicit filters if provided
            if (locationFilter != null && !locationFilter.isBlank()) {
                if (user.getLocation() == null || !user.getLocation().toLowerCase().contains(locationFilter.trim().toLowerCase())) {
                    continue;
                }
            }

            if (companyFilter != null && !companyFilter.isBlank()) {
                boolean matchCompany = userExps.stream()
                        .anyMatch(e -> e.getCompanyName() != null && e.getCompanyName().toLowerCase().contains(companyFilter.trim().toLowerCase()));
                if (!matchCompany) {
                    continue;
                }
            }

            if (skillFilter != null && !skillFilter.isBlank()) {
                boolean matchSkill = skillNames.stream()
                        .anyMatch(s -> s.toLowerCase().contains(skillFilter.trim().toLowerCase()));
                if (!matchSkill) {
                    continue;
                }
            }

            int score = calculateRelevanceScore(user, userExps, skillNames, normalizedQuery, queryTokens);

            // If query is present, only include if score > 0
            if (!normalizedQuery.isBlank() && score <= 0) {
                continue;
            }

            SearchUserDto dto = SearchUserDto.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .headline(user.getHeadline())
                    .bio(user.getBio())
                    .location(user.getLocation())
                    .avatarUrl(user.getAvatarUrl())
                    .bannerUrl(user.getBannerUrl())
                    .currentCompany(currentComp)
                    .currentTitle(currentTit)
                    .skills(skillNames)
                    .relevanceScore(score)
                    .build();

            scoredUsers.add(dto);
        }

        // Sort descending by relevance score, then alphabetically by name
        scoredUsers.sort((a, b) -> {
            int cmp = Integer.compare(b.getRelevanceScore(), a.getRelevanceScore());
            if (cmp != 0) return cmp;
            return a.getName().compareToIgnoreCase(b.getName());
        });

        // Apply pagination
        int start = Math.min(page * size, scoredUsers.size());
        int end = Math.min(start + size, scoredUsers.size());
        return scoredUsers.subList(start, end);
    }

    public SearchSuggestionsDto getSuggestions(String query) {
        String normalized = query != null ? query.trim().toLowerCase() : "";
        if (normalized.isBlank()) {
            return SearchSuggestionsDto.builder()
                    .people(Collections.emptyList())
                    .companies(Collections.emptyList())
                    .skills(Collections.emptyList())
                    .build();
        }

        // 1. People suggestions (Top 5)
        List<SearchUserDto> people = searchPeople(normalized, null, null, null, 0, 5);
        List<SearchSuggestionsDto.SearchPersonSuggestionDto> peopleSuggestions = people.stream()
                .map(p -> SearchSuggestionsDto.SearchPersonSuggestionDto.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .headline(p.getHeadline() != null ? p.getHeadline() : (p.getCurrentTitle() != null ? p.getCurrentTitle() : "Member @ Nexora"))
                        .avatarUrl(p.getAvatarUrl())
                        .build())
                .collect(Collectors.toList());

        // 2. Company suggestions (Top 4)
        List<Company> companies = companyRepository.searchCompanies(normalized, PageRequest.of(0, 4));
        List<SearchSuggestionsDto.SearchCompanySuggestionDto> companySuggestions = companies.stream()
                .map(c -> {
                    long count = experienceRepository.countByCompanyNameIgnoreCase(c.getName());
                    return SearchSuggestionsDto.SearchCompanySuggestionDto.builder()
                            .id(c.getId())
                            .name(c.getName())
                            .logoUrl(c.getLogoUrl())
                            .industry(c.getIndustry())
                            .memberCount(count)
                            .build();
                })
                .collect(Collectors.toList());

        // 3. Skill suggestions (Top 4)
        List<Skill> skills = skillRepository.searchSkills(normalized, PageRequest.of(0, 4));
        List<SearchSuggestionsDto.SearchSkillSuggestionDto> skillSuggestions = skills.stream()
                .map(s -> {
                    long count = userSkillRepository.countBySkillNameIgnoreCase(s.getName());
                    return SearchSuggestionsDto.SearchSkillSuggestionDto.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .category(s.getCategory())
                            .memberCount(count)
                            .build();
                })
                .collect(Collectors.toList());

        return SearchSuggestionsDto.builder()
                .people(peopleSuggestions)
                .companies(companySuggestions)
                .skills(skillSuggestions)
                .build();
    }

    public List<CompanyDto> searchCompaniesAdvanced(String query, String industryFilter, int page, int size) {
        String normalized = query != null ? query.trim().toLowerCase() : "";
        List<Company> list;
        if (normalized.isBlank()) {
            list = companyRepository.findAll();
        } else {
            list = companyRepository.searchCompanies(normalized, PageRequest.of(0, 100));
        }

        if (industryFilter != null && !industryFilter.isBlank()) {
            list = list.stream()
                    .filter(c -> c.getIndustry() != null && c.getIndustry().toLowerCase().contains(industryFilter.trim().toLowerCase()))
                    .collect(Collectors.toList());
        }

        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());

        return list.subList(start, end).stream()
                .map(c -> modelMapper.map(c, CompanyDto.class))
                .collect(Collectors.toList());
    }

    public List<SkillDto> searchSkillsAdvanced(String query, int page, int size) {
        String normalized = query != null ? query.trim().toLowerCase() : "";
        List<Skill> list;
        if (normalized.isBlank()) {
            list = skillRepository.findAll();
        } else {
            list = skillRepository.searchSkills(normalized, PageRequest.of(0, 100));
        }

        int start = Math.min(page * size, list.size());
        int end = Math.min(start + size, list.size());

        return list.subList(start, end).stream()
                .map(s -> modelMapper.map(s, SkillDto.class))
                .collect(Collectors.toList());
    }

    private int calculateRelevanceScore(
            User user,
            List<Experience> experiences,
            List<String> skills,
            String query,
            String[] tokens
    ) {
        if (query.isBlank()) {
            // Default baseline score for empty query (ordered by completeness)
            int baseline = 10;
            if (user.getAvatarUrl() != null) baseline += 5;
            if (user.getHeadline() != null) baseline += 5;
            return baseline;
        }

        int score = 0;
        String userName = user.getName() != null ? user.getName().toLowerCase() : "";
        String userHeadline = user.getHeadline() != null ? user.getHeadline().toLowerCase() : "";
        String userBio = user.getBio() != null ? user.getBio().toLowerCase() : "";
        String userLoc = user.getLocation() != null ? user.getLocation().toLowerCase() : "";

        // 1. Exact full name match
        if (userName.equals(query)) {
            score += 100;
        } else if (userName.startsWith(query)) {
            score += 60;
        } else if (userName.contains(query)) {
            score += 45;
        }

        // 2. Reversed Name match (e.g. "Gupta Abhinav" vs "Abhinav Gupta")
        String[] nameParts = userName.split("\\s+");
        if (tokens.length >= 2) {
            boolean allTokensInName = Arrays.stream(tokens).allMatch(userName::contains);
            if (allTokensInName) {
                score += 55;
            }
        }

        // 3. Token-by-token name matching
        for (String t : tokens) {
            if (t.length() >= 2 && userName.contains(t)) {
                score += 20;
            }
        }

        // 4. Headline match
        if (!userHeadline.isBlank()) {
            if (userHeadline.equals(query)) {
                score += 50;
            } else if (userHeadline.contains(query)) {
                score += 30;
            } else {
                for (String t : tokens) {
                    if (t.length() >= 3 && userHeadline.contains(t)) {
                        score += 15;
                    }
                }
            }
        }

        // 5. Skills match
        for (String s : skills) {
            String sl = s.toLowerCase();
            if (sl.equals(query)) {
                score += 40;
            } else if (sl.contains(query)) {
                score += 25;
            } else {
                for (String t : tokens) {
                    if (t.length() >= 3 && sl.contains(t)) {
                        score += 10;
                    }
                }
            }
        }

        // 6. Experience (Company / Title) match
        for (Experience exp : experiences) {
            if (exp.getCompanyName() != null) {
                String c = exp.getCompanyName().toLowerCase();
                if (c.contains(query)) {
                    score += Boolean.TRUE.equals(exp.getIsCurrentlyWorking()) ? 30 : 15;
                }
            }
            if (exp.getTitle() != null) {
                String tit = exp.getTitle().toLowerCase();
                if (tit.contains(query)) {
                    score += Boolean.TRUE.equals(exp.getIsCurrentlyWorking()) ? 30 : 15;
                }
            }
        }

        // 7. Location match
        if (!userLoc.isBlank() && userLoc.contains(query)) {
            score += 20;
        }

        // 8. Bio match
        if (!userBio.isBlank() && userBio.contains(query)) {
            score += 10;
        }

        // 9. Profile completeness boost
        if (score > 0) {
            if (user.getAvatarUrl() != null && !user.getAvatarUrl().isBlank()) score += 5;
            if (user.getHeadline() != null && !user.getHeadline().isBlank()) score += 5;
            if (user.getLocation() != null && !user.getLocation().isBlank()) score += 5;
        }

        return score;
    }
}
