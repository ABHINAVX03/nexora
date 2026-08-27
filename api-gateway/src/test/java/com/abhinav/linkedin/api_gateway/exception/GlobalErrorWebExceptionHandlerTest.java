package com.abhinav.linkedin.api_gateway.exception;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ResponseStatusException;
import reactor.test.StepVerifier;

import java.net.ConnectException;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GlobalErrorWebExceptionHandlerTest {

    private GlobalErrorWebExceptionHandler exceptionHandler;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        exceptionHandler = new GlobalErrorWebExceptionHandler(objectMapper);
    }

    @Test
    void testHandle_jwtAuthenticationException_returns401Json() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        JwtAuthenticationException exception = new JwtAuthenticationException("Invalid token");

        StepVerifier.create(exceptionHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        assertEquals(MediaType.APPLICATION_JSON, exchange.getResponse().getHeaders().getContentType());
    }

    @Test
    void testHandle_notFound_returns404Json() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/unknown").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.NOT_FOUND, "Route not found");

        StepVerifier.create(exceptionHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(HttpStatus.NOT_FOUND, exchange.getResponse().getStatusCode());
    }

    @Test
    void testHandle_responseStatusException_returnsGivenStatus() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        ResponseStatusException exception = new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");

        StepVerifier.create(exceptionHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(HttpStatus.FORBIDDEN, exchange.getResponse().getStatusCode());
    }

    @Test
    void testHandle_illegalArgumentException_returns400Json() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        IllegalArgumentException exception = new IllegalArgumentException("Invalid argument provided");

        StepVerifier.create(exceptionHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(HttpStatus.BAD_REQUEST, exchange.getResponse().getStatusCode());
    }

    @Test
    void testHandle_connectException_returns503Json() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        ConnectException exception = new ConnectException("Connection refused");

        StepVerifier.create(exceptionHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exchange.getResponse().getStatusCode());
    }

    @Test
    void testHandle_genericException_returns500Json() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);
        RuntimeException exception = new RuntimeException("Unexpected internal failure");

        StepVerifier.create(exceptionHandler.handle(exchange, exception))
                .verifyComplete();

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exchange.getResponse().getStatusCode());
    }
}
