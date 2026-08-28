package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.EducationCreateRequestDto;
import com.abhinav.linkedin.user_service.dto.EducationDto;
import com.abhinav.linkedin.user_service.service.EducationService;
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
public class EducationController {

    private final EducationService educationService;

    @GetMapping("/{userId}/educations")
    public ResponseEntity<List<EducationDto>> getUserEducations(@PathVariable Long userId) {
        List<EducationDto> educations = educationService.getEducationsByUserId(userId);
        return ResponseEntity.ok(educations);
    }

    @PostMapping("/me/educations")
    public ResponseEntity<EducationDto> createMyEducation(
            @RequestBody EducationCreateRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        EducationDto created = educationService.createEducation(userId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/me/educations/{educationId}")
    public ResponseEntity<EducationDto> updateMyEducation(
            @PathVariable Long educationId,
            @RequestBody EducationCreateRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        EducationDto updated = educationService.updateEducation(userId, educationId, requestDto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/me/educations/{educationId}")
    public ResponseEntity<Void> deleteMyEducation(
            @PathVariable Long educationId,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        educationService.deleteEducation(userId, educationId);
        return ResponseEntity.noContent().build();
    }
}
