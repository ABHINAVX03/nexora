package com.abhinav.linkedin.posts_service.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import static org.hamcrest.Matchers.hasItem;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private MockMvc mockMvc;

    @Data
    static class TestDto {
        @NotBlank(message = "Field cannot be blank")
        private String name;
    }

    @RestController
    @RequestMapping("/test")
    static class TestController {

        @GetMapping("/not-found")
        public void throwNotFound() {
            throw new ResourceNotFoundException("Post not found with id: 99");
        }

        @GetMapping("/forbidden")
        public void throwForbidden() {
            throw new ForbiddenException("Not authorized");
        }

        @GetMapping("/conflict")
        public void throwConflict() {
            throw new DataIntegrityViolationException("Duplicate key violation");
        }

        @GetMapping("/bad-request")
        public void throwBadRequest() {
            throw new BadRequestException("Invalid input data");
        }

        @GetMapping("/illegal-state")
        public void throwIllegalState() {
            throw new IllegalStateException("You have already liked this post.");
        }

        @GetMapping("/illegal-argument")
        public void throwIllegalArgument() {
            throw new IllegalArgumentException("Invalid ID format");
        }

        @PostMapping("/validate")
        public void validateBody(@Valid @RequestBody TestDto dto) {
        }

        @GetMapping("/generic-error")
        public void throwGeneric() {
            throw new RuntimeException("Database connection timeout");
        }
    }

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        mockMvc = MockMvcBuilders.standaloneSetup(new TestController())
                .setControllerAdvice(exceptionHandler)
                .build();
    }

    @Test
    void handleResourceNotFoundException_Returns404WithExactMessage() throws Exception {
        mockMvc.perform(get("/test/not-found"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Post not found with id: 99"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    @Test
    void handleForbiddenException_Returns403() throws Exception {
        mockMvc.perform(get("/test/forbidden"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Not authorized"));
    }

    @Test
    void handleDataIntegrityViolationException_Returns409() throws Exception {
        mockMvc.perform(get("/test/conflict"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void handleBadRequestException_Returns400WithExactMessage() throws Exception {
        mockMvc.perform(get("/test/bad-request"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid input data"));
    }

    @Test
    void handleIllegalStateException_Returns400WithExactMessage() throws Exception {
        mockMvc.perform(get("/test/illegal-state"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("You have already liked this post."));
    }

    @Test
    void handleIllegalArgumentException_Returns400WithExactMessage() throws Exception {
        mockMvc.perform(get("/test/illegal-argument"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid ID format"));
    }

    @Test
    void handleValidationException_Returns400WithSubErrors() throws Exception {
        mockMvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Input validation failed"))
                .andExpect(jsonPath("$.subErrors", hasItem("name: Field cannot be blank")));
    }

    @Test
    void handleGenericException_Returns500SanitizedMessage() throws Exception {
        mockMvc.perform(get("/test/generic-error"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.message").value("An unexpected internal error occurred. Please try again later."));
    }

    @Test
    void handleGenericException_NullMessageFallback() {
        RuntimeException ex = new NullPointerException();
        ResponseEntity<ApiError> response = exceptionHandler.handleGenericException(ex);

        assertEquals(500, response.getStatusCode().value());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().getStatus());
        assertEquals("An unexpected internal error occurred. Please try again later.", response.getBody().getMessage());
    }
}
