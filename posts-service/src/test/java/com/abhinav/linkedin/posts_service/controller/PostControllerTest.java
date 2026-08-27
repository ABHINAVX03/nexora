package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.auth.UserContextFilter;
import com.abhinav.linkedin.posts_service.dto.PostCreateRequestDto;
import com.abhinav.linkedin.posts_service.dto.PostDto;
import com.abhinav.linkedin.posts_service.exception.GlobalExceptionHandler;
import com.abhinav.linkedin.posts_service.service.PostService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostControllerTest {

    private MockMvc mockMvc;
    private PostService postService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        postService = Mockito.mock(PostService.class);
        PostController postController = new PostController(postService);
        objectMapper = new ObjectMapper();

        mockMvc = MockMvcBuilders.standaloneSetup(postController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new UserContextFilter())
                .build();
    }

    @Test
    void testCreatePost_withValidUserHeader_success() throws Exception {
        PostCreateRequestDto requestDto = new PostCreateRequestDto();
        requestDto.setContent("Hello World Post");

        PostDto postDto = new PostDto();
        postDto.setId(10L);
        postDto.setContent("Hello World Post");
        postDto.setUserId(123L);

        when(postService.createPost(any(PostCreateRequestDto.class), eq(123L))).thenReturn(postDto);

        mockMvc.perform(post("/core")
                        .header("X-User-Id", "123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.userId").value(123))
                .andExpect(jsonPath("$.content").value("Hello World Post"));
    }

    @Test
    void testCreatePost_withoutUserHeader_returnsBadRequest() throws Exception {
        PostCreateRequestDto requestDto = new PostCreateRequestDto();
        requestDto.setContent("Hello World Post");

        mockMvc.perform(post("/core")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(requestDto)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User ID is missing in request headers"));
    }

    @Test
    void testGetPost_success() throws Exception {
        PostDto postDto = new PostDto();
        postDto.setId(5L);
        postDto.setContent("Sample Content");

        when(postService.getPostById(eq(5L), eq(123L))).thenReturn(postDto);

        mockMvc.perform(get("/core/5")
                        .header("X-User-Id", "123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(5))
                .andExpect(jsonPath("$.content").value("Sample Content"));
    }

    @Test
    void testGetAllPostsOfUsers_success() throws Exception {
        PostDto postDto = new PostDto();
        postDto.setId(1L);
        postDto.setUserId(20L);

        when(postService.getAllPostsofUsers(eq(20L), eq(123L))).thenReturn(List.of(postDto));

        mockMvc.perform(get("/core/users/20/allPosts")
                        .header("X-User-Id", "123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].userId").value(20));
    }
}
