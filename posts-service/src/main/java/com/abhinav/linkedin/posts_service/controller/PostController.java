package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.auth.UserContextHolder;
import com.abhinav.linkedin.posts_service.dto.PollDto;
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
import java.util.Map;

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

    @PostMapping("/{postId}/bookmark")
    public ResponseEntity<Map<String, Object>> toggleBookmark(
            @PathVariable Long postId,
            HttpServletRequest request) {
        Long currentUserId = requireUserId(request);
        boolean isBookmarked = postService.toggleBookmark(postId, currentUserId);
        return ResponseEntity.ok(Map.of("bookmarked", isBookmarked, "postId", postId));
    }

    @GetMapping("/bookmarks")
    public ResponseEntity<List<PostDto>> getBookmarkedPosts(HttpServletRequest request) {
        Long currentUserId = requireUserId(request);
        List<PostDto> bookmarks = postService.getBookmarkedPosts(currentUserId);
        return ResponseEntity.ok(bookmarks);
    }

    @GetMapping("/{postId}/is-bookmarked")
    public ResponseEntity<Map<String, Boolean>> isPostBookmarked(
            @PathVariable Long postId,
            HttpServletRequest request) {
        Long currentUserId = extractUserId(request);
        boolean isBookmarked = postService.isPostBookmarked(postId, currentUserId);
        return ResponseEntity.ok(Map.of("bookmarked", isBookmarked));
    }

    @PostMapping("/polls/{pollId}/vote/{optionId}")
    public ResponseEntity<PollDto> votePoll(
            @PathVariable Long pollId,
            @PathVariable Long optionId,
            HttpServletRequest request) {
        Long currentUserId = requireUserId(request);
        PollDto updatedPoll = postService.votePoll(pollId, optionId, currentUserId);
        return ResponseEntity.ok(updatedPoll);
    }

    @GetMapping("/{postId}/poll")
    public ResponseEntity<PollDto> getPoll(
            @PathVariable Long postId,
            HttpServletRequest request) {
        Long currentUserId = extractUserId(request);
        PollDto poll = postService.getPollByPostId(postId, currentUserId);
        return ResponseEntity.ok(poll);
    }

    @GetMapping("/search")
    public ResponseEntity<List<PostDto>> searchPosts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        Long currentUserId = extractUserId(request);
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        List<PostDto> results = postService.searchPosts(searchQuery, sort, page, size, currentUserId);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/hashtags/search")
    public ResponseEntity<List<com.abhinav.linkedin.posts_service.dto.HashtagDto>> searchHashtags(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query) {
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        List<com.abhinav.linkedin.posts_service.dto.HashtagDto> results = postService.searchHashtags(searchQuery);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/search/suggestions")
    public ResponseEntity<com.abhinav.linkedin.posts_service.dto.PostSuggestionsDto> getPostSuggestions(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String query) {
        String searchQuery = (q != null && !q.isBlank()) ? q : query;
        com.abhinav.linkedin.posts_service.dto.PostSuggestionsDto results = postService.getPostSuggestions(searchQuery);
        return ResponseEntity.ok(results);
    }
}