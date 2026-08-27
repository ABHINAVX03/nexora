package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.dto.CommentCreateRequestDto;
import com.abhinav.linkedin.posts_service.dto.CommentDto;
import com.abhinav.linkedin.posts_service.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/posts/{postId}/comments", "/core/{postId}/comments"})
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long postId,
            @RequestBody CommentCreateRequestDto requestDto
    ) {
        CommentDto commentDto = commentService.addComment(postId, requestDto);
        return new ResponseEntity<>(commentDto, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<CommentDto>> getComments(@PathVariable Long postId) {
        List<CommentDto> comments = commentService.getCommentsForPost(postId);
        return ResponseEntity.ok(comments);
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long commentId
    ) {
        commentService.deleteComment(postId, commentId);
        return ResponseEntity.noContent().build();
    }
}
