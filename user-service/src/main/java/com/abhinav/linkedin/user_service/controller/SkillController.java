package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.AddSkillRequestDto;
import com.abhinav.linkedin.user_service.dto.EndorserSummaryDto;
import com.abhinav.linkedin.user_service.dto.SkillDto;
import com.abhinav.linkedin.user_service.dto.UserSkillDto;
import com.abhinav.linkedin.user_service.service.SkillService;
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
public class SkillController {

    private final SkillService skillService;

    @GetMapping("/skills/search")
    public ResponseEntity<List<SkillDto>> searchSkills(@RequestParam(required = false) String query) {
        List<SkillDto> skills = skillService.searchSkills(query);
        return ResponseEntity.ok(skills);
    }

    @GetMapping("/{userId}/skills")
    public ResponseEntity<List<UserSkillDto>> getUserSkills(
            @PathVariable Long userId,
            HttpServletRequest request
    ) {
        Long viewerUserId = UserContextUtil.extractUserId(request);
        List<UserSkillDto> skills = skillService.getUserSkills(userId, viewerUserId);
        return ResponseEntity.ok(skills);
    }

    @PostMapping("/me/skills")
    public ResponseEntity<UserSkillDto> addMySkill(
            @RequestBody AddSkillRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        UserSkillDto created = skillService.addUserSkill(userId, requestDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/me/skills/{userSkillId}")
    public ResponseEntity<Void> removeMySkill(
            @PathVariable Long userSkillId,
            HttpServletRequest request
    ) {
        Long userId = UserContextUtil.requireUserId(request);
        skillService.removeUserSkill(userId, userSkillId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{targetUserId}/skills/{userSkillId}/endorse")
    public ResponseEntity<UserSkillDto> endorseSkill(
            @PathVariable Long targetUserId,
            @PathVariable Long userSkillId,
            HttpServletRequest request
    ) {
        Long endorserId = UserContextUtil.requireUserId(request);
        UserSkillDto updated = skillService.endorseSkill(endorserId, targetUserId, userSkillId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{targetUserId}/skills/{userSkillId}/endorse")
    public ResponseEntity<UserSkillDto> removeEndorsement(
            @PathVariable Long targetUserId,
            @PathVariable Long userSkillId,
            HttpServletRequest request
    ) {
        Long endorserId = UserContextUtil.requireUserId(request);
        UserSkillDto updated = skillService.removeEndorsement(endorserId, targetUserId, userSkillId);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{targetUserId}/skills/{userSkillId}/endorsers")
    public ResponseEntity<List<EndorserSummaryDto>> getSkillEndorsers(
            @PathVariable Long targetUserId,
            @PathVariable Long userSkillId
    ) {
        List<EndorserSummaryDto> endorsers = skillService.getSkillEndorsers(targetUserId, userSkillId);
        return ResponseEntity.ok(endorsers);
    }
}
