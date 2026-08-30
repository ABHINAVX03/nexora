package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.PostBookmark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostBookmarkRepository extends JpaRepository<PostBookmark, Long> {

    @Query("SELECT b FROM PostBookmark b JOIN FETCH b.post WHERE b.userId = :userId ORDER BY b.createdAt DESC")
    List<PostBookmark> findByUserIdWithPost(@Param("userId") Long userId);

    Optional<PostBookmark> findByUserIdAndPostId(Long userId, Long postId);

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PostBookmark b WHERE b.userId = :userId AND b.post.id = :postId")
    void deleteByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    @Modifying
    @Transactional
    @Query("DELETE FROM PostBookmark b WHERE b.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
