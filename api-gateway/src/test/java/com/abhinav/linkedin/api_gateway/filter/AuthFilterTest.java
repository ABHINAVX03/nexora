package com.abhinav.linkedin.api_gateway.filter;

import com.abhinav.linkedin.api_gateway.JWTService;
import com.abhinav.linkedin.api_gateway.exception.JwtAuthenticationException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthFilterTest {

    private JWTService jwtService;
    private AuthFilter authFilter;
    private GatewayFilterChain filterChain;

    @BeforeEach
    void setUp() {
        jwtService = Mockito.mock(JWTService.class);
        authFilter = new AuthFilter(jwtService);
        filterChain = Mockito.mock(GatewayFilterChain.class);
        when(filterChain.filter(any())).thenReturn(Mono.empty());
    }

    @Test
    void testFilter_missingAuthHeader_throwsJwtAuthenticationException() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authFilter.apply(new AuthFilter.Config()).filter(exchange, filterChain);

        StepVerifier.create(result)
                .expectErrorMatches(throwable -> throwable instanceof JwtAuthenticationException &&
                        throwable.getMessage().contains("Authorization header is missing"))
                .verify();

        verify(filterChain, never()).filter(any());
    }

    @Test
    void testFilter_invalidTokenType_throwsJwtAuthenticationException() {
        String token = "invalidToken";
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtService.isAccessToken(token)).thenReturn(false);

        Mono<Void> result = authFilter.apply(new AuthFilter.Config()).filter(exchange, filterChain);

        StepVerifier.create(result)
                .expectErrorMatches(throwable -> throwable instanceof JwtAuthenticationException &&
                        throwable.getMessage().contains("Invalid token type"))
                .verify();

        verify(filterChain, never()).filter(any());
    }

    @Test
    void testFilter_expiredJwtToken_throwsJwtAuthenticationException() {
        String token = "expiredToken";
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtService.isAccessToken(token)).thenReturn(true);
        when(jwtService.isTokenValid(token)).thenReturn(false);

        Mono<Void> result = authFilter.apply(new AuthFilter.Config()).filter(exchange, filterChain);

        StepVerifier.create(result)
                .expectErrorMatches(throwable -> throwable instanceof JwtAuthenticationException &&
                        throwable.getMessage().contains("JWT token has expired or is invalid"))
                .verify();

        verify(filterChain, never()).filter(any());
    }

    @Test
    void testFilter_validTokenWithBearerPrefix_addsUserIdHeaderAndProceeds() {
        String token = "validToken";
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/v1/posts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.isAccessToken(token)).thenReturn(true);
        when(jwtService.getUserIdFromToken(token)).thenReturn(42L);

        Mono<Void> result = authFilter.apply(new AuthFilter.Config()).filter(exchange, filterChain);

        StepVerifier.create(result)
                .verifyComplete();

        verify(filterChain, times(1)).filter(argThat(ex ->
                "42".equals(ex.getRequest().getHeaders().getFirst("X-User-Id"))
        ));
    }

    @Test
    void testFilter_publicEndpoint_bypassesAuthAndSanitizesHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/v1/auth/login")
                .header("X-User-Id", "999")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        Mono<Void> result = authFilter.apply(new AuthFilter.Config()).filter(exchange, filterChain);

        StepVerifier.create(result)
                .verifyComplete();

        verify(filterChain, times(1)).filter(argThat(ex ->
                ex.getRequest().getHeaders().getFirst("X-User-Id") == null
        ));
    }
}
