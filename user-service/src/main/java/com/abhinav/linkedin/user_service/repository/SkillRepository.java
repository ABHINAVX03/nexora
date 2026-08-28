package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.Skill;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SkillRepository extends JpaRepository<Skill, Long> {

    Optional<Skill> findByNormalizedName(String normalizedName);

    Optional<Skill> findByNameIgnoreCase(String name);

    @Query("SELECT s FROM Skill s WHERE LOWER(s.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY " +
           "CASE WHEN LOWER(s.name) = LOWER(:query) THEN 1 " +
           "     WHEN LOWER(s.name) LIKE LOWER(CONCAT(:query, '%')) THEN 2 " +
           "     ELSE 3 END, s.name ASC")
    List<Skill> searchSkills(@Param("query") String query, Pageable pageable);
}
