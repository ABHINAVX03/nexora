package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.client.ConnectionClient;
import com.abhinav.linkedin.posts_service.dto.PersonDto;
import com.abhinav.linkedin.posts_service.dto.PostCreateRequestDto;
import com.abhinav.linkedin.posts_service.dto.PostDto;
import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.entity.PostBookmark;
import com.abhinav.linkedin.posts_service.event.PostCreatedEvent;
import com.abhinav.linkedin.posts_service.exception.ForbiddenException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.PostBookmarkRepository;
import com.abhinav.linkedin.posts_service.repository.PostLikeRepository;
import com.abhinav.linkedin.posts_service.repository.PostRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PostService {

    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostBookmarkRepository postBookmarkRepository;
    private final ConnectionClient connectionClient;
    private final ModelMapper modelMapper;
    private final KafkaTemplate<Long, PostCreatedEvent> kafkaTemplate;

    @Value("${app.kafka.topics.post-created:post-created-topic}")
    private String postCreatedTopic;

    @CacheEvict(value = "userFeed", allEntries = true)
    public PostDto createPost(PostCreateRequestDto postDto, Long userId) {
        log.info("Creating post for user: {}", userId);
        Post post = modelMapper.map(postDto, Post.class);
        post.setUserId(userId);
        if (postDto.getMediaUrl() != null && !postDto.getMediaUrl().isBlank()) {
            post.setMediaUrl(postDto.getMediaUrl().trim());
        }

        Post savedPost = postRepository.save(post);
        PostCreatedEvent postCreatedEvent = PostCreatedEvent.builder()
                .postId(savedPost.getId())
                .creatorId(userId)
                .content(postDto.getContent())
                .build();

        try {
            kafkaTemplate.send(postCreatedTopic, savedPost.getId(), postCreatedEvent);
            log.info("Published PostCreatedEvent to Kafka topic: {} for postId: {}", postCreatedTopic, savedPost.getId());
        } catch (Exception e) {
            log.error("Failed to publish PostCreatedEvent to Kafka: {}", e.getMessage(), e);
        }

        return modelMapper.map(savedPost, PostDto.class);
    }

    public PostDto getPostById(Long id, Long currentUserId) {
        log.debug("Retrieving post by id {} for user {}", id, currentUserId);

        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + id));

        return modelMapper.map(post, PostDto.class);
    }

    @CacheEvict(value = "posts", key = "#postId")
    public PostDto updatePost(Long postId, PostCreateRequestDto updateDto, Long currentUserId) {
        log.info("Updating post {} by user {}", postId, currentUserId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!post.getUserId().equals(currentUserId)) {
            log.warn("User {} attempted to update post {} owned by user {}", currentUserId, postId, post.getUserId());
            throw new ForbiddenException("You are not authorized to update this post");
        }

        if (updateDto.getContent() != null) {
            post.setContent(updateDto.getContent());
        }
        if (updateDto.getMediaUrl() != null) {
            post.setMediaUrl(updateDto.getMediaUrl().trim());
        }
        Post updatedPost = postRepository.save(post);
        return modelMapper.map(updatedPost, PostDto.class);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "posts", key = "#postId"),
            @CacheEvict(value = "userFeed", allEntries = true)
    })
    public void deletePost(Long postId, Long currentUserId) {
        log.info("Deleting post {} by user {}", postId, currentUserId);

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        if (!post.getUserId().equals(currentUserId)) {
            log.warn("User {} attempted to delete post {} owned by user {}", currentUserId, postId, post.getUserId());
            throw new ForbiddenException("You are not authorized to delete this post");
        }

        postBookmarkRepository.deleteByPostId(postId);
        postLikeRepository.deleteByPostId(postId);
        postRepository.delete(post);
        log.info("Successfully deleted post {}", postId);
    }

    public List<PostDto> getAllPostsofUsers(Long targetUserId, Long currentUserId) {
        log.debug("Retrieving posts by user id {} requested by {}", targetUserId, currentUserId);

        List<Post> posts = postRepository.findByUserId(targetUserId);
        return posts.stream()
                .map(element -> modelMapper.map(element, PostDto.class))
                .collect(Collectors.toList());
    }

    @Cacheable(value = "userFeed", key = "#currentUserId")
    @CircuitBreaker(name = "connectionService", fallbackMethod = "getFeedFallback")
    public List<PostDto> getFeed(Long currentUserId) {
        log.debug("Retrieving dynamic feed for user: {}", currentUserId);
        List<Post> allPosts = postRepository.findAllByOrderByCreatedAtDesc();

        if (allPosts.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> priorityAuthorIds = new HashSet<>();
        if (currentUserId != null) {
            priorityAuthorIds.add(currentUserId);
            try {
                List<PersonDto> connections = connectionClient.getFirstDegreeConnections(currentUserId);
                if (connections != null) {
                    for (PersonDto p : connections) {
                        if (p.getUserId() != null) {
                            priorityAuthorIds.add(p.getUserId());
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Could not fetch connection IDs for feed ranking: {}", e.getMessage());
            }
        }

        List<Post> priorityPosts = new ArrayList<>();
        List<Post> communityPosts = new ArrayList<>();

        for (Post post : allPosts) {
            if (priorityAuthorIds.contains(post.getUserId())) {
                priorityPosts.add(post);
            } else {
                communityPosts.add(post);
            }
        }

        List<Post> rankedPosts = new ArrayList<>(priorityPosts);
        rankedPosts.addAll(communityPosts);

        return rankedPosts.stream()
                .map(post -> modelMapper.map(post, PostDto.class))
                .collect(Collectors.toList());
    }

    public List<PostDto> getFeedFallback(Long currentUserId, Throwable throwable) {
        log.warn("Circuit breaker fallback triggered for getFeed({}). Remote connection-service unavailable: {}",
                currentUserId, throwable.getMessage());
        List<Post> allPosts = postRepository.findAllByOrderByCreatedAtDesc();
        return allPosts.stream()
                .map(post -> modelMapper.map(post, PostDto.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean toggleBookmark(Long postId, Long currentUserId) {
        log.info("Toggling bookmark on post {} for user {}", postId, currentUserId);
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Optional<PostBookmark> existing = postBookmarkRepository.findByUserIdAndPostId(currentUserId, postId);
        if (existing.isPresent()) {
            postBookmarkRepository.deleteByUserIdAndPostId(currentUserId, postId);
            log.info("Removed bookmark for post {} by user {}", postId, currentUserId);
            return false;
        } else {
            PostBookmark bookmark = PostBookmark.builder()
                    .userId(currentUserId)
                    .post(post)
                    .build();
            postBookmarkRepository.save(bookmark);
            log.info("Saved bookmark for post {} by user {}", postId, currentUserId);
            return true;
        }
    }

    public boolean isPostBookmarked(Long postId, Long currentUserId) {
        if (currentUserId == null || postId == null) return false;
        return postBookmarkRepository.existsByUserIdAndPostId(currentUserId, postId);
    }

    public List<PostDto> getBookmarkedPosts(Long currentUserId) {
        log.debug("Retrieving bookmarked posts for user: {}", currentUserId);
        List<PostBookmark> bookmarks = postBookmarkRepository.findByUserIdWithPost(currentUserId);
        return bookmarks.stream()
                .map(b -> modelMapper.map(b.getPost(), PostDto.class))
                .collect(Collectors.toList());
    }

    @CircuitBreaker(name = "connectionService", fallbackMethod = "isFirstDegreeConnectionFallback")
    public boolean isFirstDegreeConnection(Long authorId, Long currentUserId) {
        if (authorId.equals(currentUserId)) {
            return true;
        }

        Boolean connected = connectionClient.areConnected(authorId);
        if (connected != null && connected) {
            return true;
        }

        List<PersonDto> connections = connectionClient.getFirstDegreeConnections(authorId);
        if (connections != null) {
            return connections.stream().anyMatch(p -> currentUserId.equals(p.getUserId()));
        }

        return false;
    }

    public boolean isFirstDegreeConnectionFallback(Long authorId, Long currentUserId, Throwable throwable) {
        log.error("Circuit breaker fallback triggered for isFirstDegreeConnection({}, {}). Remote connection-service error: {}",
                authorId, currentUserId, throwable.getMessage());
        return false;
    }
}