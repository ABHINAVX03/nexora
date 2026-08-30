package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.Post;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserId(Long userId);
    List<Post> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);
    List<Post> findAllByOrderByCreatedAtDesc();
    void deleteByUserId(Long userId);

    @Modifying
    @Transactional
    @Query("UPDATE Post p SET p.repostOfPostId = NULL WHERE p.repostOfPostId = :postId")
    void nullifyRepostOfPostId(@Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query(value = "DELETE FROM post_media_urls WHERE post_id = :postId", nativeQuery = true)
    void deleteLegacyPostMediaUrls(@Param("postId") Long postId);

    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY p.createdAt DESC")
    List<Post> searchPostsByContent(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Post> searchPostsByContentAll(@Param("query") String query);

    @Query("SELECT COUNT(p) FROM Post p WHERE LOWER(p.content) LIKE LOWER(CONCAT('%', :hashtag, '%'))")
    long countPostsByHashtag(@Param("hashtag") String hashtag);
}
