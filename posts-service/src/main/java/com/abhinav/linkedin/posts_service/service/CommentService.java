package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.auth.UserContextHolder;
import com.abhinav.linkedin.posts_service.dto.CommentCreateRequestDto;
import com.abhinav.linkedin.posts_service.dto.CommentDto;
import com.abhinav.linkedin.posts_service.entity.Comment;
import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.event.PostCommentedEvent;
import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.exception.ForbiddenException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.CommentRepository;
import com.abhinav.linkedin.posts_service.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final ModelMapper modelMapper;
    private final KafkaTemplate<Long, Object> kafkaTemplate;

    @Value("${app.kafka.topics.post-commented:post-commented-topic}")
    private String postCommentedTopic;

    public CommentDto addComment(Long postId, CommentCreateRequestDto requestDto) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new ForbiddenException("Authentication required to comment.");
        }

        if (requestDto == null || requestDto.getContent() == null || requestDto.getContent().trim().isBlank()) {
            throw new BadRequestException("Comment content cannot be empty.");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new ResourceNotFoundException("Post not found with id: " + postId));

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(requestDto.getContent().trim());

        Comment saved = commentRepository.save(comment);
        log.info("Comment saved. id={}, postId={}, userId={}", saved.getId(), postId, userId);

        // Emit notification event if commenter is not the post author
        if (!userId.equals(post.getUserId())) {
            PostCommentedEvent event = PostCommentedEvent.builder()
                    .postId(postId)
                    .commentId(saved.getId())
                    .commenterId(userId)
                    .creatorId(post.getUserId())
                    .commentContent(saved.getContent())
                    .build();

            try {
                kafkaTemplate.send(postCommentedTopic, postId, event);
                log.info("Published PostCommentedEvent to Kafka topic: {}", postCommentedTopic);
            } catch (Exception e) {
                log.error("Failed to publish PostCommentedEvent: {}", e.getMessage(), e);
            }
        }

        return modelMapper.map(saved, CommentDto.class);
    }

    public List<CommentDto> getCommentsForPost(Long postId) {
        if (!postRepository.existsById(postId)) {
            throw new ResourceNotFoundException("Post not found with id: " + postId);
        }

        List<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(postId);
        return comments.stream()
                .map(c -> modelMapper.map(c, CommentDto.class))
                .collect(Collectors.toList());
    }

    public void deleteComment(Long postId, Long commentId) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null) {
            throw new ForbiddenException("Authentication required.");
        }

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found with id: " + commentId));

        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new ResourceNotFoundException("Post not found."));

        // Only comment author or post owner can delete the comment
        if (!userId.equals(comment.getUserId()) && !userId.equals(post.getUserId())) {
            throw new ForbiddenException("You are not authorized to delete this comment.");
        }

        commentRepository.delete(comment);
        log.info("Comment deleted. commentId={}, userId={}", commentId, userId);
    }
}
