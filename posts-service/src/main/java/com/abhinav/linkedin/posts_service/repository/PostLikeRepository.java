package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByPostIdAndUserId(Long postId, Long userId);

    long countByPostId(Long postId);

    @Transactional
    void deleteByPostIdAndUserId(Long postId, Long userId);

    @Transactional
    void deleteByPostId(Long postId);
}
