package com.abhinav.linkedin.posts_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@Table(
    name = "posts_likes",
    indexes = {
        @Index(name = "idx_post_likes_post_user", columnList = "postId, userId", unique = true),
        @Index(name = "idx_post_likes_post", columnList = "postId")
    }
)
public class PostLike {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long postId;
    private Long userId;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
