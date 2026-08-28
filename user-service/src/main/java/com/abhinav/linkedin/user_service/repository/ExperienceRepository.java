package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.Experience;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    List<Experience> findByUserIdOrderByIsCurrentlyWorkingDescStartDateDesc(Long userId);

    List<Experience> findByUserId(Long userId);
}
