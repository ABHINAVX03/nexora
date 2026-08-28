package com.abhinav.linkedin.user_service.repository;

import com.abhinav.linkedin.user_service.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("SELECT u FROM User u WHERE " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(u.headline IS NOT NULL AND LOWER(u.headline) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(u.location IS NOT NULL AND LOWER(u.location) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(CAST(u.id AS string) = :query) " +
           "ORDER BY u.id ASC")
    List<User> searchUsers(@Param("query") String query);
}
