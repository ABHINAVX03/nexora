package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.Education;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EducationRepository extends JpaRepository<Education, Long> {

    List<Education> findByUserIdOrderByStartYearDesc(Long userId);

    List<Education> findByUserId(Long userId);
}
