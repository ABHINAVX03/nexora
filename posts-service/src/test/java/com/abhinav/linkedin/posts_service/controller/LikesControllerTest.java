package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.auth.UserContextFilter;
import com.abhinav.linkedin.posts_service.dto.LikeStatusDto;
import com.abhinav.linkedin.posts_service.exception.GlobalExceptionHandler;
import com.abhinav.linkedin.posts_service.service.PostLikeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
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
        when(postLikeService.toggleLike(10L, 55L)).thenReturn(new LikeStatusDto(10L, true, 1L));

        mockMvc.perform(post("/likes/10")
                        .header("X-User-Id", "55"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasLiked").value(true))
                .andExpect(jsonPath("$.likesCount").value(1));

        verify(postLikeService).toggleLike(10L, 55L);
    }

    @Test
    void testLikePost_withoutUserHeader_returnsBadRequest() throws Exception {
        mockMvc.perform(post("/likes/10"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("User ID is missing in request headers"));
    }

    @Test
    void testUnlikePost_withValidUserHeader_success() throws Exception {
        when(postLikeService.getLikeStatus(10L, 55L)).thenReturn(new LikeStatusDto(10L, false, 0L));

        mockMvc.perform(delete("/likes/10")
                        .header("X-User-Id", "55"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasLiked").value(false))
                .andExpect(jsonPath("$.likesCount").value(0));

        verify(postLikeService).unlikePost(10L, 55L);
    }
}
