package com.abhinav.linkedin.posts_service.repository;

import com.abhinav.linkedin.posts_service.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostIdOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);
    void deleteByPostId(Long postId);
}
