package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserId(Long userId);
    List<Post> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);
    List<Post> findAllByOrderByCreatedAtDesc();
    void deleteByUserId(Long userId);

    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY p.createdAt DESC")
    List<Post> searchPostsByContent(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Post> searchPostsByContentAll(@Param("query") String query);

    @Query("SELECT COUNT(p) FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :hashtag, '%'))")
    long countPostsByHashtag(@Param("hashtag") String hashtag);
}
