package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.auth.UserContextFilter;
import com.abhinav.linkedin.posts_service.exception.GlobalExceptionHandler;
import com.abhinav.linkedin.posts_service.service.PostLikeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class LikesControllerTest {

    private MockMvc mockMvc;
    private PostLikeService postLikeService;

    @BeforeEach
    void setUp() {
        postLikeService = Mockito.mock(PostLikeService.class);
        LikesController likesController = new LikesController(postLikeService);

        mockMvc = MockMvcBuilders.standaloneSetup(likesController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .addFilters(new UserContextFilter())
                .build();
    }

    @Test
    void testLikePost_withValidUserHeader_success() throws Exception {
        doNothing().when(postLikeService).likePost(10L, 55L);

        mockMvc.perform(post("/likes/10")
                        .header("X-User-Id", "55"))
                .andExpect(status().isNoContent());

        verify(postLikeService).likePost(10L, 55L);
    }

    @Test
    void testLikePost_withoutUserHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/likes/10"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User ID is missing in request headers"));
    }

    @Test
    void testUnlikePost_withValidUserHeader_success() throws Exception {
        doNothing().when(postLikeService).unlikePost(10L, 55L);

        mockMvc.perform(delete("/likes/10")
                        .header("X-User-Id", "55"))
                .andExpect(status().isNoContent());

        verify(postLikeService).unlikePost(10L, 55L);
    }
}
