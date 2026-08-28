package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.client.ConnectionClient;
import com.abhinav.linkedin.user_service.dto.*;
import com.abhinav.linkedin.user_service.entity.Skill;
import com.abhinav.linkedin.user_service.entity.SkillEndorsement;
import com.abhinav.linkedin.user_service.entity.User;
import com.abhinav.linkedin.user_service.entity.UserSkill;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.user_service.repository.SkillEndorsementRepository;
import com.abhinav.linkedin.user_service.repository.SkillRepository;
import com.abhinav.linkedin.user_service.repository.UserRepository;
import com.abhinav.linkedin.user_service.repository.UserSkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillService {

    private final SkillRepository skillRepository;
    private final UserSkillRepository userSkillRepository;
    private final SkillEndorsementRepository endorsementRepository;
    private final UserRepository userRepository;
    private final ConnectionClient connectionClient;

    public List<SkillDto> searchSkills(String query) {
        if (query == null || query.trim().isBlank()) {
            return skillRepository.findAll(PageRequest.of(0, 20)).stream()
                    .map(this::mapSkillToDto)
                    .collect(Collectors.toList());
        }
        String trimmed = query.trim();
        return skillRepository.searchSkills(trimmed, PageRequest.of(0, 20)).stream()
                .map(this::mapSkillToDto)
                .collect(Collectors.toList());
    }

    public List<UserSkillDto> getUserSkills(Long targetUserId, Long viewerUserId) {
        List<UserSkill> userSkills = userSkillRepository.findByUserIdOrderByDisplayOrderAscCreatedAtAsc(targetUserId);

        return userSkills.stream().map(us -> {
            boolean isEndorsedByViewer = false;
            if (viewerUserId != null) {
                isEndorsedByViewer = endorsementRepository.existsByUserSkillIdAndEndorserId(us.getId(), viewerUserId);
            }

            List<EndorserSummaryDto> topEndorsers = endorsementRepository
                    .findByUserSkillIdOrderByCreatedAtDesc(us.getId(), PageRequest.of(0, 5))
                    .stream()
                    .map(this::mapEndorsementToDto)
                    .collect(Collectors.toList());

            return UserSkillDto.builder()
                    .id(us.getId())
                    .userId(us.getUserId())
                    .skillId(us.getSkill() != null ? us.getSkill().getId() : null)
                    .skillName(us.getSkillName())
                    .category(us.getSkill() != null ? us.getSkill().getCategory() : "Other")
                    .endorsementCount(us.getEndorsementCount())
                    .isEndorsedByViewer(isEndorsedByViewer)
                    .topEndorsers(topEndorsers)
                    .displayOrder(us.getDisplayOrder())
                    .build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public UserSkillDto addUserSkill(Long userId, AddSkillRequestDto req) {
        if ((req.getSkillId() == null) && (req.getSkillName() == null || req.getSkillName().trim().isBlank())) {
            throw new BadRequestException("Skill name or ID is required");
        }

        Skill skill = null;
        String skillName = req.getSkillName();

        if (req.getSkillId() != null) {
            skill = skillRepository.findById(req.getSkillId()).orElse(null);
            if (skill != null) {
                skillName = skill.getName();
            }
        }

        if (skill == null && skillName != null && !skillName.trim().isBlank()) {
            String trimmedName = skillName.trim();
            String normalized = trimmedName.toLowerCase();

            Optional<Skill> existingSkill = skillRepository.findByNormalizedName(normalized);
            if (existingSkill.isPresent()) {
                skill = existingSkill.get();
                skillName = skill.getName();
            } else {
                // Auto-create in normalized catalog for future reuse
                skill = Skill.builder()
                        .name(trimmedName)
                        .normalizedName(normalized)
                        .category("General")
                        .build();
                skill = skillRepository.save(skill);
            }
        }

        if (skillName == null || skillName.trim().isBlank()) {
            throw new BadRequestException("Invalid skill name");
        }

        // Check if user already added this skill
        if (skill != null && userSkillRepository.existsByUserIdAndSkillId(userId, skill.getId())) {
            throw new BadRequestException("You have already added '" + skill.getName() + "' to your profile");
        }
        if (userSkillRepository.existsByUserIdAndSkillNameIgnoreCase(userId, skillName.trim())) {
            throw new BadRequestException("You have already added '" + skillName.trim() + "' to your profile");
        }

        UserSkill userSkill = UserSkill.builder()
                .userId(userId)
                .skill(skill)
                .skillName(skillName.trim())
                .endorsementCount(0)
                .displayOrder(0)
                .build();

        UserSkill saved = userSkillRepository.save(userSkill);
        log.info("Added skill '{}' (id: {}) to user {}", saved.getSkillName(), saved.getId(), userId);

        return UserSkillDto.builder()
                .id(saved.getId())
                .userId(saved.getUserId())
                .skillId(skill != null ? skill.getId() : null)
                .skillName(saved.getSkillName())
                .category(skill != null ? skill.getCategory() : "General")
                .endorsementCount(0)
                .isEndorsedByViewer(false)
                .topEndorsers(List.of())
                .displayOrder(saved.getDisplayOrder())
                .build();
    }

    @Transactional
    public void removeUserSkill(Long userId, Long userSkillId) {
        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + userSkillId));

        if (!userSkill.getUserId().equals(userId)) {
            throw new BadRequestException("You are not authorized to remove this skill");
        }

        userSkillRepository.delete(userSkill);
        log.info("Removed skill id {} from user {}", userSkillId, userId);
    }

    @Transactional
    public UserSkillDto endorseSkill(Long endorserId, Long targetUserId, Long userSkillId) {
        if (endorserId == null) {
            throw new BadRequestException("Authentication required to endorse skills");
        }

        if (endorserId.equals(targetUserId)) {
            throw new BadRequestException("You cannot endorse your own skills");
        }

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Target user not found with id: " + targetUserId));

        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found on profile: " + userSkillId));

        if (!userSkill.getUserId().equals(targetUserId)) {
            throw new BadRequestException("Skill does not belong to the specified user");
        }

        // CRITICAL 1st-Degree Connection Validation via Connection Service
        boolean isConnected = false;
        try {
            Boolean connectionResult = connectionClient.areConnectedBetween(targetUserId, endorserId);
            isConnected = Boolean.TRUE.equals(connectionResult);
        } catch (Exception e) {
            log.error("Failed to verify 1st-degree connection status via connection-service: {}", e.getMessage());
            throw new BadRequestException("Unable to verify connection status. Only 1st-degree connections can endorse skills.");
        }

        if (!isConnected) {
            throw new BadRequestException("Only 1st-degree connections can endorse skills. Please connect with " + targetUser.getName() + " first.");
        }

        // Check if already endorsed
        Optional<SkillEndorsement> existing = endorsementRepository.findByUserSkillIdAndEndorserId(userSkillId, endorserId);
        if (existing.isPresent()) {
            log.info("User {} has already endorsed userSkillId {}", endorserId, userSkillId);
            return getUserSkillDto(userSkill, endorserId);
        }

        User endorser = userRepository.findById(endorserId)
                .orElseThrow(() -> new ResourceNotFoundException("Endorser profile not found"));

        SkillEndorsement endorsement = SkillEndorsement.builder()
                .userSkill(userSkill)
                .userId(targetUserId)
                .skillId(userSkill.getSkill() != null ? userSkill.getSkill().getId() : 0L)
                .endorserId(endorserId)
                .endorserName(endorser.getName())
                .endorserHeadline(endorser.getHeadline())
                .endorserAvatarUrl(endorser.getAvatarUrl())
                .build();

        endorsementRepository.save(endorsement);

        int newCount = (int) endorsementRepository.countByUserSkillId(userSkillId);
        userSkill.setEndorsementCount(newCount);
        userSkillRepository.save(userSkill);

        log.info("User {} successfully endorsed skill '{}' for user {}", endorserId, userSkill.getSkillName(), targetUserId);
        return getUserSkillDto(userSkill, endorserId);
    }

    @Transactional
    public UserSkillDto removeEndorsement(Long endorserId, Long targetUserId, Long userSkillId) {
        if (endorserId == null) {
            throw new BadRequestException("Authentication required");
        }

        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found on profile: " + userSkillId));

        if (!userSkill.getUserId().equals(targetUserId)) {
            throw new BadRequestException("Skill does not belong to the specified user");
        }

        Optional<SkillEndorsement> existing = endorsementRepository.findByUserSkillIdAndEndorserId(userSkillId, endorserId);
        if (existing.isPresent()) {
            endorsementRepository.delete(existing.get());
            int newCount = (int) endorsementRepository.countByUserSkillId(userSkillId);
            userSkill.setEndorsementCount(Math.max(0, newCount));
            userSkillRepository.save(userSkill);
            log.info("User {} removed endorsement for skill '{}' from user {}", endorserId, userSkill.getSkillName(), targetUserId);
        }

        return getUserSkillDto(userSkill, endorserId);
    }

    public List<EndorserSummaryDto> getSkillEndorsers(Long targetUserId, Long userSkillId) {
        UserSkill userSkill = userSkillRepository.findById(userSkillId)
                .orElseThrow(() -> new ResourceNotFoundException("Skill not found with id: " + userSkillId));

        if (!userSkill.getUserId().equals(targetUserId)) {
            throw new BadRequestException("Skill does not belong to the specified user");
        }

        return endorsementRepository.findByUserSkillIdOrderByCreatedAtDesc(userSkillId).stream()
                .map(this::mapEndorsementToDto)
                .collect(Collectors.toList());
    }

    private UserSkillDto getUserSkillDto(UserSkill userSkill, Long viewerUserId) {
        boolean isEndorsed = false;
        if (viewerUserId != null) {
            isEndorsed = endorsementRepository.existsByUserSkillIdAndEndorserId(userSkill.getId(), viewerUserId);
        }

        List<EndorserSummaryDto> topEndorsers = endorsementRepository
                .findByUserSkillIdOrderByCreatedAtDesc(userSkill.getId(), PageRequest.of(0, 5))
                .stream()
                .map(this::mapEndorsementToDto)
                .collect(Collectors.toList());

        return UserSkillDto.builder()
                .id(userSkill.getId())
                .userId(userSkill.getUserId())
                .skillId(userSkill.getSkill() != null ? userSkill.getSkill().getId() : null)
                .skillName(userSkill.getSkillName())
                .category(userSkill.getSkill() != null ? userSkill.getSkill().getCategory() : "General")
                .endorsementCount(userSkill.getEndorsementCount())
                .isEndorsedByViewer(isEndorsed)
                .topEndorsers(topEndorsers)
                .displayOrder(userSkill.getDisplayOrder())
                .build();
    }

    private SkillDto mapSkillToDto(Skill s) {
        return SkillDto.builder()
                .id(s.getId())
                .name(s.getName())
                .category(s.getCategory())
                .build();
    }

    private EndorserSummaryDto mapEndorsementToDto(SkillEndorsement e) {
        return EndorserSummaryDto.builder()
                .id(e.getId())
                .userId(e.getEndorserId())
                .name(e.getEndorserName())
                .headline(e.getEndorserHeadline())
                .avatarUrl(e.getEndorserAvatarUrl())
                .endorsedAt(e.getCreatedAt())
                .build();
    }
}
