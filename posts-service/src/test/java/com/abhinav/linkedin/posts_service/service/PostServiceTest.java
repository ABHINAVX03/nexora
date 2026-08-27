package com.abhinav.linkedin.posts_service.service;

import com.abhinav.linkedin.posts_service.client.ConnectionClient;
import com.abhinav.linkedin.posts_service.dto.PersonDto;
import com.abhinav.linkedin.posts_service.dto.PostCreateRequestDto;
import com.abhinav.linkedin.posts_service.dto.PostDto;
import com.abhinav.linkedin.posts_service.entity.Post;
import com.abhinav.linkedin.posts_service.event.PostCreatedEvent;
import com.abhinav.linkedin.posts_service.exception.ForbiddenException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.repository.PostLikeRepository;
import com.abhinav.linkedin.posts_service.repository.PostRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private ConnectionClient connectionClient;

    @Spy
    private ModelMapper modelMapper = new ModelMapper();

    @Mock
    private KafkaTemplate<Long, PostCreatedEvent> kafkaTemplate;

    @InjectMocks
    private PostService postService;

    @BeforeEach
    void init() {
        ReflectionTestUtils.setField(postService, "postCreatedTopic", "post-created-topic");
    }

    @Test
    void createPost_success_sendsKafkaEvent() {
        PostCreateRequestDto requestDto = new PostCreateRequestDto();
        requestDto.setContent("Test content");

        Post savedPost = new Post();
        savedPost.setId(1L);
        savedPost.setUserId(100L);
        savedPost.setContent("Test content");

        when(postRepository.save(any(Post.class))).thenReturn(savedPost);

        PostDto result = postService.createPost(requestDto, 100L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals(100L, result.getUserId());
        assertEquals("Test content", result.getContent());

        ArgumentCaptor<PostCreatedEvent> eventCaptor = ArgumentCaptor.forClass(PostCreatedEvent.class);
        verify(kafkaTemplate).send(eq("post-created-topic"), eq(1L), eventCaptor.capture());

        PostCreatedEvent sentEvent = eventCaptor.getValue();
        assertEquals(1L, sentEvent.getPostId());
        assertEquals(100L, sentEvent.getCreatorId());
        assertEquals("Test content", sentEvent.getContent());
    }

    @Test
    void getPostById_byAuthor_success() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);
        post.setContent("Test content");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        PostDto result = postService.getPostById(1L, 100L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getPostById_byFirstDegreeConnection_success() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);
        post.setContent("Test content");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(connectionClient.areConnected(100L)).thenReturn(true);

        PostDto result = postService.getPostById(1L, 200L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
    }

    @Test
    void getPostById_byNonConnectedUser_throwsForbidden() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);
        post.setContent("Test content");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(connectionClient.areConnected(100L)).thenReturn(false);
        when(connectionClient.getFirstDegreeConnections(100L)).thenReturn(List.of());

        assertThrows(ForbiddenException.class, () -> postService.getPostById(1L, 300L));
    }

    @Test
    void getPostById_notFound_throwsException() {
        when(postRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> postService.getPostById(99L, 100L));
    }

    @Test
    void updatePost_byAuthor_success() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);
        post.setContent("Old content");

        Post updatedPost = new Post();
        updatedPost.setId(1L);
        updatedPost.setUserId(100L);
        updatedPost.setContent("New content");

        PostCreateRequestDto updateDto = new PostCreateRequestDto();
        updateDto.setContent("New content");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));
        when(postRepository.save(any(Post.class))).thenReturn(updatedPost);

        PostDto result = postService.updatePost(1L, updateDto, 100L);
        assertEquals("New content", result.getContent());
    }

    @Test
    void updatePost_byNonAuthor_throwsForbidden() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);

        PostCreateRequestDto updateDto = new PostCreateRequestDto();
        updateDto.setContent("New content");

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        assertThrows(ForbiddenException.class, () -> postService.updatePost(1L, updateDto, 200L));
    }

    @Test
    void deletePost_byAuthor_success() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        postService.deletePost(1L, 100L);

        verify(postLikeRepository).deleteByPostId(1L);
        verify(postRepository).delete(post);
    }

    @Test
    void deletePost_byNonAuthor_throwsForbidden() {
        Post post = new Post();
        post.setId(1L);
        post.setUserId(100L);

        when(postRepository.findById(1L)).thenReturn(Optional.of(post));

        assertThrows(ForbiddenException.class, () -> postService.deletePost(1L, 200L));
    }

    @Test
    void getAllPostsofUsers_success() {
        Post post1 = new Post();
        post1.setId(1L);
        post1.setUserId(100L);

        when(postRepository.findByUserId(100L)).thenReturn(List.of(post1));

        List<PostDto> result = postService.getAllPostsofUsers(100L, 100L);

        assertEquals(1, result.size());
        assertEquals(1L, result.get(0).getId());
    }

    @Test
    void getFeedFallback_returnsDegradedFeedWithOwnPosts() {
        Post ownPost = new Post();
        ownPost.setId(10L);
        ownPost.setUserId(100L);
        ownPost.setContent("My post");

        when(postRepository.findByUserId(100L)).thenReturn(List.of(ownPost));

        List<PostDto> degradedFeed = postService.getFeedFallback(100L, new RuntimeException("Connection service timeout"));

        assertNotNull(degradedFeed);
        assertEquals(1, degradedFeed.size());
        assertEquals(10L, degradedFeed.get(0).getId());
    }

    @Test
    void isFirstDegreeConnectionFallback_failsClosed() {
        boolean result = postService.isFirstDegreeConnectionFallback(100L, 200L, new RuntimeException("Remote call failure"));
        assertFalse(result);
    }
}
