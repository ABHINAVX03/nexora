package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.EducationalInstitution;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EducationalInstitutionRepository extends JpaRepository<EducationalInstitution, Long> {

    Optional<EducationalInstitution> findByNameIgnoreCase(String name);

    @Query("SELECT i FROM EducationalInstitution i WHERE " +
           "LOWER(i.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(i.shortName IS NOT NULL AND LOWER(i.shortName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
           "ORDER BY " +
           "CASE WHEN LOWER(i.shortName) = LOWER(:query) THEN 1 " +
           "     WHEN LOWER(i.name) LIKE LOWER(CONCAT(:query, '%')) THEN 2 " +
           "     ELSE 3 END, i.name ASC")
    List<EducationalInstitution> searchInstitutions(@Param("query") String query, Pageable pageable);
}
