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
    name = "posts",
    indexes = {
        @Index(name = "idx_posts_user_created", columnList = "userId, createdAt DESC"),
        @Index(name = "idx_posts_created", columnList = "createdAt DESC")
    }
)
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 5000)
    private String content;

    @Column(nullable = true, length = 1000)
    private String mediaUrl;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    private java.util.List<PostImage> images = new java.util.ArrayList<>();

    @Column(name = "repost_of_post_id", nullable = true)
    private Long repostOfPostId;

    private Long userId;

    @OneToOne(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Poll poll;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
