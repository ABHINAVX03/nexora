package com.abhinav.linkedin.api_gateway.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.core.io.buffer.DataBufferFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.MethodNotAllowedException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebExceptionHandler;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
@RequiredArgsConstructor
public class GlobalErrorWebExceptionHandler implements WebExceptionHandler {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();

        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        HttpStatus status;
        String message;

        if (ex instanceof JwtAuthenticationException) {
            status = HttpStatus.UNAUTHORIZED;
            message = ex.getMessage();
            log.warn("Authentication failure for path [{}]: {}", exchange.getRequest().getURI().getPath(), message);
        } else if (ex instanceof MethodNotAllowedException mnae) {
            status = HttpStatus.METHOD_NOT_ALLOWED;
            message = "HTTP method " + exchange.getRequest().getMethod() + " is not supported for this endpoint";
            log.warn("Method not allowed for path [{}]: {}", exchange.getRequest().getURI().getPath(), mnae.getMessage());
        } else if (ex instanceof ResponseStatusException rse) {
            status = HttpStatus.resolve(rse.getStatusCode().value());
            if (status == null) {
                status = HttpStatus.INTERNAL_SERVER_ERROR;
            }
            message = rse.getReason() != null ? rse.getReason() : rse.getMessage();
            log.warn("Response status error for path [{}]: {}", exchange.getRequest().getURI().getPath(), message);
        } else if (ex instanceof org.springframework.cloud.gateway.support.NotFoundException) {
            status = HttpStatus.NOT_FOUND;
            message = "Requested route or service was not found";
            log.warn("Route not found for path [{}]: {}", exchange.getRequest().getURI().getPath(), ex.getMessage());
        } else if (ex instanceof java.net.ConnectException) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = "Downstream service is currently unavailable. Please try again later.";
            log.error("Connection failed for path [{}]: {}", exchange.getRequest().getURI().getPath(), ex.getMessage());
        } else if (ex instanceof IllegalArgumentException || ex instanceof IllegalStateException) {
            status = HttpStatus.BAD_REQUEST;
            message = ex.getMessage();
            log.warn("Bad request for path [{}]: {}", exchange.getRequest().getURI().getPath(), message);
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            message = (ex.getMessage() != null && !ex.getMessage().isBlank())
                    ? ex.getMessage()
                    : "An unexpected error occurred in API Gateway";
            log.error("Unhandled gateway error for path [{}]:", exchange.getRequest().getURI().getPath(), ex);
        }

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiError apiError = ApiError.builder()
                .status(status.value())
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();

        DataBufferFactory bufferFactory = response.bufferFactory();
        byte[] bytes;
        try {
            bytes = objectMapper.writeValueAsBytes(apiError);
        } catch (JsonProcessingException e) {
            log.error("Error serializing ApiError response", e);
            bytes = ("{\"status\":" + status.value() + ",\"message\":\"" + message + "\"}").getBytes();
        }

        DataBuffer buffer = bufferFactory.wrap(bytes);
        return response.writeWith(Mono.just(buffer));
    }
}
