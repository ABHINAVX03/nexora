package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.auth.UserContextHolder;
import com.abhinav.linkedin.posts_service.dto.LikeStatusDto;
import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.service.PostLikeService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/likes", "/core/likes"})
@RequiredArgsConstructor
public class LikesController {

    private final PostLikeService postLikeService;

    private Long resolveUserId(HttpServletRequest request) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null) {
            String header = request.getHeader("X-User-Id");
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return userId;
    }

    @PostMapping("/{postId}")
    public ResponseEntity<LikeStatusDto> toggleLikePost(
            @PathVariable Long postId,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new BadRequestException("User ID is missing in request headers");
        }

        LikeStatusDto status = postLikeService.toggleLike(postId, userId);
        return ResponseEntity.ok(status);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<LikeStatusDto> unlikePost(
            @PathVariable Long postId,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        if (userId == null) {
            throw new BadRequestException("User ID is missing in request headers");
        }

        postLikeService.unlikePost(postId, userId);
        LikeStatusDto status = postLikeService.getLikeStatus(postId, userId);
        return ResponseEntity.ok(status);
    }

    @GetMapping("/{postId}/status")
    public ResponseEntity<LikeStatusDto> getLikeStatus(
            @PathVariable Long postId,
            HttpServletRequest request
    ) {
        Long userId = resolveUserId(request);
        LikeStatusDto status = postLikeService.getLikeStatus(postId, userId);
        return ResponseEntity.ok(status);
    }
}
