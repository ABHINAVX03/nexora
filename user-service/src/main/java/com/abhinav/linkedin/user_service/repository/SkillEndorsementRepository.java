package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.SkillEndorsement;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillEndorsementRepository extends JpaRepository<SkillEndorsement, Long> {

    List<SkillEndorsement> findByUserSkillIdOrderByCreatedAtDesc(Long userSkillId);

    List<SkillEndorsement> findByUserSkillIdOrderByCreatedAtDesc(Long userSkillId, Pageable pageable);

    Optional<SkillEndorsement> findByUserIdAndSkillIdAndEndorserId(Long userId, Long skillId, Long endorserId);

    Optional<SkillEndorsement> findByUserSkillIdAndEndorserId(Long userSkillId, Long endorserId);

    boolean existsByUserIdAndSkillIdAndEndorserId(Long userId, Long skillId, Long endorserId);

    boolean existsByUserSkillIdAndEndorserId(Long userSkillId, Long endorserId);

    long countByUserSkillId(Long userSkillId);
}
