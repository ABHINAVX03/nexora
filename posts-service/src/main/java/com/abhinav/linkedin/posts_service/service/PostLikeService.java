package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.dto.LikeStatusDto;
import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.entity.PostLike;
import com.abhinav.linkedin.posts_service.event.PostLikedEvent;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.PostLikeRepository;
import com.abhinav.linkedin.posts_service.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostLikeService {

    private final PostLikeRepository postLikeRepository;
    private final PostRepository postRepository;
    private final KafkaTemplate<Long, Object> kafkaTemplate;

    @Value("${app.kafka.topics.post-liked:post-liked-topic}")
    private String postLikedTopic;

    public LikeStatusDto toggleLike(Long postId, Long userId) {
        log.info("Toggle like request: postId={}, userId={}", postId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested post could not be found with id: " + postId));

        boolean alreadyLiked = postLikeRepository.existsByPostIdAndUserId(postId, userId);
        boolean newLikedState;

        if (alreadyLiked) {
            try {
                postLikeRepository.deleteByPostIdAndUserId(postId, userId);
            } catch (Exception e) {
                log.warn("Concurrent unlike warning for postId={}, userId={}: {}", postId, userId, e.getMessage());
            }
            newLikedState = false;
            log.info("Post unliked: postId={}, userId={}", postId, userId);
        } else {
            try {
                PostLike postLike = new PostLike();
                postLike.setPostId(postId);
                postLike.setUserId(userId);
                postLikeRepository.save(postLike);
                newLikedState = true;
                log.info("Post liked: postId={}, userId={}", postId, userId);

                // Emit notification event if the liker is not the author
                if (!userId.equals(post.getUserId())) {
                    PostLikedEvent postLikedEvent = PostLikedEvent.builder()
                            .postId(postId)
                            .likedByUserId(userId)
                            .creatorId(post.getUserId())
                            .build();

                    try {
                        kafkaTemplate.send(postLikedTopic, postId, postLikedEvent);
                        log.info("Published PostLikedEvent to Kafka topic: {} for postId: {}", postLikedTopic, postId);
                    } catch (Exception e) {
                        log.error("Failed to publish PostLikedEvent to Kafka: {}", e.getMessage(), e);
                    }
                }
            } catch (DataIntegrityViolationException e) {
                log.warn("Concurrent duplicate like ignored gracefully for postId={}, userId={}", postId, userId);
                newLikedState = true;
            }
        }

        long likesCount = postLikeRepository.countByPostId(postId);
        return new LikeStatusDto(postId, newLikedState, likesCount);
    }

    public void likePost(Long postId, Long userId) {
        log.info("Like request received. postId={}, userId={}", postId, userId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("The requested post could not be found with id: " + postId));

        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            log.info("User already liked postId={}, userId={}. Idempotent success.", postId, userId);
            return;
        }

        try {
            PostLike postLike = new PostLike();
            postLike.setPostId(postId);
            postLike.setUserId(userId);
            postLikeRepository.save(postLike);

            log.info("Post liked successfully. postId={}, userId={}", postId, userId);

            if (!userId.equals(post.getUserId())) {
                PostLikedEvent postLikedEvent = PostLikedEvent.builder()
                        .postId(postId)
                        .likedByUserId(userId)
                        .creatorId(post.getUserId())
                        .build();

                try {
                    kafkaTemplate.send(postLikedTopic, postId, postLikedEvent);
                    log.info("Published PostLikedEvent to Kafka topic: {} for postId: {}", postLikedTopic, postId);
                } catch (Exception e) {
                    log.error("Failed to publish PostLikedEvent to Kafka: {}", e.getMessage(), e);
                }
            }
        } catch (DataIntegrityViolationException e) {
            log.info("Concurrent like duplicate handled idempotently for postId={}, userId={}", postId, userId);
        }
    }

    public void unlikePost(Long postId, Long userId) {
        log.info("Unlike request received. postId={}, userId={}", postId, userId);
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("The requested post could not be found with id: " + postId);
        }

        if (postLikeRepository.existsByPostIdAndUserId(postId, userId)) {
            try {
                postLikeRepository.deleteByPostIdAndUserId(postId, userId);
                log.info("Post unliked successfully. postId={}, userId={}", postId, userId);
            } catch (Exception e) {
                log.warn("Concurrent unlike handled for postId={}, userId={}: {}", postId, userId, e.getMessage());
            }
        } else {
            log.info("User had not liked postId={}, userId={}. Idempotent success.", postId, userId);
        }
    }

    public LikeStatusDto getLikeStatus(Long postId, Long userId) {
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("The requested post could not be found with id: " + postId);
        }

        boolean hasLiked = userId != null && postLikeRepository.existsByPostIdAndUserId(postId, userId);
        long likesCount = postLikeRepository.countByPostId(postId);
        return new LikeStatusDto(postId, hasLiked, likesCount);
    }
}