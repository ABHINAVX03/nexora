package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.entity.PostLike;
import com.abhinav.linkedin.posts_service.event.PostLikedEvent;
import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.PostLikeRepository;
import com.abhinav.linkedin.posts_service.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostLikeServiceTest {

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private KafkaTemplate<Long, PostLikedEvent> kafkaTemplate;

    @InjectMocks
    private PostLikeService postLikeService;

    @BeforeEach
    void init() {
        ReflectionTestUtils.setField(postLikeService, "postLikedTopic", "post-liked-topic");
    }

    @Test
    void likePost_success_sendsKafkaEvent() {
        Long postId = 10L;
        Long userId = 20L;
        Long creatorId = 5L;

        Post post = new Post();
        post.setId(postId);
        post.setUserId(creatorId);

        when(postRepository.findById(postId)).thenReturn(Optional.of(post));
        when(postLikeRepository.existsByPostIdAndUserId(postId, userId)).thenReturn(false);

        postLikeService.likePost(postId, userId);

        verify(postLikeRepository).save(any(PostLike.class));

        ArgumentCaptor<PostLikedEvent> eventCaptor = ArgumentCaptor.forClass(PostLikedEvent.class);
        verify(kafkaTemplate).send(eq("post-liked-topic"), eq(postId), eventCaptor.capture());

        PostLikedEvent sentEvent = eventCaptor.getValue();
        assertEquals(postId, sentEvent.getPostId());
        assertEquals(userId, sentEvent.getLikedByUserId());
        assertEquals(creatorId, sentEvent.getCreatorId());
    }

    @Test
    void likePost_postNotFound_throwsException() {
        when(postRepository.findById(10L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> postLikeService.likePost(10L, 20L));
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    void likePost_alreadyLiked_throwsException() {
        Post post = new Post();
        post.setId(10L);
        post.setUserId(5L);

        when(postRepository.findById(10L)).thenReturn(Optional.of(post));
        when(postLikeRepository.existsByPostIdAndUserId(10L, 20L)).thenReturn(true);

        assertThrows(BadRequestException.class, () -> postLikeService.likePost(10L, 20L));
        verify(kafkaTemplate, never()).send(any(), any(), any());
    }

    @Test
    void unlikePost_success() {
        when(postRepository.existsById(10L)).thenReturn(true);
        when(postLikeRepository.existsByPostIdAndUserId(10L, 20L)).thenReturn(true);

        postLikeService.unlikePost(10L, 20L);

        verify(postLikeRepository).deleteByPostIdAndUserId(10L, 20L);
    }
}
