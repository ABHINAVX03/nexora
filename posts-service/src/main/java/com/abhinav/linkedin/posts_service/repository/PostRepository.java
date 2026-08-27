package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByUserId(Long userId);
    List<Post> findByUserIdInOrderByCreatedAtDesc(List<Long> userIds);
    List<Post> findAllByOrderByCreatedAtDesc();
    void deleteByUserId(Long userId);
}
