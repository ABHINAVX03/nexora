package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.auth.UserContextHolder;
import com.abhinav.linkedin.posts_service.dto.PostCreateRequestDto;
import com.abhinav.linkedin.posts_service.dto.PostDto;
import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.service.PostService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/core", "/posts"})
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    private Long extractUserId(HttpServletRequest request) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null && request != null) {
            String header = request.getHeader("X-User-Id");
            if (header == null || header.isBlank()) {
                header = request.getHeader("X-UserId");
            }
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return userId;
    }

    private Long requireUserId(HttpServletRequest request) {
        Long userId = extractUserId(request);
        if (userId == null) {
            throw new BadRequestException("User ID is missing in request headers");
        }
        return userId;
    }

    @PostMapping
    public ResponseEntity<PostDto> createPost(
            @RequestBody @Valid PostCreateRequestDto postDto,
            HttpServletRequest request) {

        Long userId = requireUserId(request);
        PostDto createdPost = postService.createPost(postDto, userId);
        return new ResponseEntity<>(createdPost, HttpStatus.CREATED);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<PostDto> getPost(
            @PathVariable Long postId,
            HttpServletRequest request) {

        Long currentUserId = extractUserId(request);
        PostDto postDto = postService.getPostById(postId, currentUserId);
        return ResponseEntity.ok(postDto);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<PostDto> updatePost(
            @PathVariable Long postId,
            @RequestBody @Valid PostCreateRequestDto updateDto,
            HttpServletRequest request) {

        Long currentUserId = requireUserId(request);
        PostDto updatedPost = postService.updatePost(postId, updateDto, currentUserId);
        return ResponseEntity.ok(updatedPost);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<Void> deletePost(
            @PathVariable Long postId,
            HttpServletRequest request) {

        Long currentUserId = requireUserId(request);
        postService.deletePost(postId, currentUserId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/users/{userId}/allPosts")
    public ResponseEntity<List<PostDto>> getAllPostsofUsers(
            @PathVariable Long userId,
            HttpServletRequest request) {

        Long currentUserId = extractUserId(request);
        List<PostDto> posts = postService.getAllPostsofUsers(userId, currentUserId);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/feed")
    public ResponseEntity<List<PostDto>> getFeed(HttpServletRequest request) {
        Long currentUserId = requireUserId(request);
        List<PostDto> feed = postService.getFeed(currentUserId);
        return ResponseEntity.ok(feed);
    }
}