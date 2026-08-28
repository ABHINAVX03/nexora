package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.Company;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Optional<Company> findByNameIgnoreCase(String name);

    @Query("SELECT c FROM Company c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY " +
           "CASE WHEN LOWER(c.name) = LOWER(:query) THEN 1 " +
           "     WHEN LOWER(c.name) LIKE LOWER(CONCAT(:query, '%')) THEN 2 " +
           "     ELSE 3 END, c.name ASC")
    List<Company> searchCompanies(@Param("query") String query, Pageable pageable);
}
