package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.UserSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findByUserIdOrderByDisplayOrderAscCreatedAtAsc(Long userId);

    Optional<UserSkill> findByUserIdAndSkillId(Long userId, Long skillId);

    Optional<UserSkill> findByUserIdAndSkillNameIgnoreCase(Long userId, String skillName);

    boolean existsByUserIdAndSkillId(Long userId, Long skillId);

    boolean existsByUserIdAndSkillNameIgnoreCase(Long userId, String skillName);
}
