package com.abhinav.linkedin.api_gateway.filter;

import com.abhinav.linkedin.api_gateway.JWTService;
import com.abhinav.linkedin.api_gateway.exception.JwtAuthenticationException;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpMethod;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Slf4j
public class AuthFilter extends AbstractGatewayFilterFactory<AuthFilter.Config> {

    private final JWTService jwtService;
    private final ReactiveStringRedisTemplate reactiveRedisTemplate;

    // Public endpoints that bypass authentication
    private static final List<String> OPEN_ENDPOINTS = List.of(
            "/api/v1/auth/signup",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/verify-email-otp",
            "/api/v1/auth/resend-verification-otp",
            "/api/v1/auth/forgot-password",
            "/api/v1/auth/reset-password",
            "/auth/signup",
            "/auth/login",
            "/auth/refresh",
            "/auth/verify-email-otp",
            "/auth/resend-verification-otp",
            "/auth/forgot-password",
            "/auth/reset-password",
            "/actuator/health",
            "/actuator/info"
    );

    public AuthFilter(JWTService jwtService, ReactiveStringRedisTemplate reactiveRedisTemplate) {
        super(Config.class);
        this.jwtService = jwtService;
        this.reactiveRedisTemplate = reactiveRedisTemplate;
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();

            // 1. Allow preflight OPTIONS requests without authentication (CORS)
            if (HttpMethod.OPTIONS.equals(request.getMethod())) {
                return chain.filter(exchange);
            }

            // 2. Allow open/public endpoints and static media files to bypass authentication
            if (isPublicEndpoint(path)) {
                ServerHttpRequest sanitizedRequest = request.mutate()
                        .headers(httpHeaders -> {
                            httpHeaders.remove("X-User-Id");
                            httpHeaders.remove("X-UserId");
                        })
                        .build();
                return chain.filter(exchange.mutate().request(sanitizedRequest).build());
            }

            log.info("Authenticating gateway request: {} {}", request.getMethod(), path);
            final String tokenHeader = request.getHeaders().getFirst("Authorization");

            if (tokenHeader == null || tokenHeader.isBlank()) {
                log.warn("Missing Authorization header for path: {}", path);
                return Mono.error(new JwtAuthenticationException("Authorization header is missing"));
            }

            final String token;
            if (tokenHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
                token = tokenHeader.substring(7).trim();
            } else {
                token = tokenHeader.trim();
            }
            if (token.isEmpty()) {
                log.warn("Token is empty in Authorization header for path: {}", path);
                return Mono.error(new JwtAuthenticationException("Authorization token is missing or empty"));
            }

            try {
                if (!jwtService.isAccessToken(token)) {
                    log.warn("Provided token is not an ACCESS token for path: {}", path);
                    return Mono.error(new JwtAuthenticationException("Invalid token type. Expected ACCESS token."));
                }

                if (!jwtService.isTokenValid(token)) {
                    log.warn("JWT token is invalid or expired for path: {}", path);
                    return Mono.error(new JwtAuthenticationException("JWT token has expired or is invalid"));
                }

                Long userId = jwtService.getUserIdFromToken(token);
                String tokenSessionId = jwtService.getSessionIdFromToken(token);

                // 3. Single Active Session Enforcement: Compare tokenSessionId against Redis active_session:{userId}
                return reactiveRedisTemplate.opsForValue().get("active_session:" + userId)
                        .defaultIfEmpty("")
                        .flatMap(activeSessionId -> {
                            if (!activeSessionId.isEmpty() && tokenSessionId != null && !tokenSessionId.equals(activeSessionId)) {
                                log.warn("Single active session violation: userId {} tokenSession [{}] superseded by activeSession [{}]",
                                        userId, tokenSessionId, activeSessionId);
                                return Mono.error(new JwtAuthenticationException(
                                        "Session expired. Your account has been logged in from another browser or device."
                                ));
                            }

                            // Sanitize any existing caller headers and inject verified user identity
                            ServerHttpRequest mutatedRequest = request.mutate()
                                    .headers(httpHeaders -> {
                                        httpHeaders.remove("X-User-Id");
                                        httpHeaders.remove("X-UserId");
                                        httpHeaders.set("X-User-Id", String.valueOf(userId));
                                        httpHeaders.set("X-UserId", String.valueOf(userId));
                                    })
                                    .build();

                            ServerWebExchange mutatedExchange = exchange.mutate()
                                    .request(mutatedRequest)
                                    .build();

                            log.debug("Successfully authenticated request for userId: {} on path: {}", userId, path);
                            return chain.filter(mutatedExchange);
                        })
                        .onErrorResume(e -> {
                            if (e instanceof JwtAuthenticationException) {
                                return Mono.error(e);
                            }
                            log.error("Authentication or session validation error on path {}: {}", path, e.getMessage());
                            return Mono.error(new JwtAuthenticationException("Authentication failed: " + e.getMessage(), e));
                        });

            } catch (ExpiredJwtException e) {
                log.warn("JWT token expired for path {}: {}", path, e.getMessage());
                return Mono.error(new JwtAuthenticationException("JWT access token has expired"));
            } catch (MalformedJwtException | SignatureException e) {
                log.warn("JWT signature/format error for path {}: {}", path, e.getMessage());
                return Mono.error(new JwtAuthenticationException("JWT token signature is invalid or malformed"));
            } catch (Exception e) {
                log.error("Authentication failed on path {}: {}", path, e.getMessage());
                return Mono.error(new JwtAuthenticationException("Authentication failed: " + e.getMessage(), e));
            }
        };
    }

    private boolean isPublicEndpoint(String path) {
        if (path == null) return false;
        if (path.contains("/media/files/") || path.contains("/avatar/files/") || path.contains("/banner/files/")) {
            return true;
        }
        return OPEN_ENDPOINTS.stream().anyMatch(path::startsWith);
    }

    public static class Config {
    }
}
