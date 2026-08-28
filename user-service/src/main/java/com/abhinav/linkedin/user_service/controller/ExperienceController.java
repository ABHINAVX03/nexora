package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.ExperienceCreateRequestDto;
import com.abhinav.linkedin.user_service.dto.ExperienceDto;
import com.abhinav.linkedin.user_service.service.ExperienceService;
import com.abhinav.linkedin.user_service.utils.UserContextUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class ExperienceController {

    private final ExperienceService experienceService;

    @GetMapping("/{userId}/experiences")
    public ResponseEntity<List<ExperienceDto>> getUserExperiences(@PathVariable Long userId) {
        List<ExperienceDto> experiences = experienceService.getExperiencesByUserId(userId);
        return ResponseEntity.ok(experiences);
    }

    @PostMapping("/me/experiences")
    public ResponseEntity<ExperienceDto> createMyExperience(
            @RequestBody ExperienceCreateRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        ExperienceDto created = experienceService.createExperience(userId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/me/experiences/{experienceId}")
    public ResponseEntity<ExperienceDto> updateMyExperience(
            @PathVariable Long experienceId,
            @RequestBody ExperienceCreateRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        ExperienceDto updated = experienceService.updateExperience(userId, experienceId, requestDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/me/experiences/{experienceId}")
    public ResponseEntity<Void> deleteMyExperience(
            @PathVariable Long experienceId,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        experienceService.deleteExperience(userId, experienceId);
        return ResponseEntity.noContent().build();
    }
}
