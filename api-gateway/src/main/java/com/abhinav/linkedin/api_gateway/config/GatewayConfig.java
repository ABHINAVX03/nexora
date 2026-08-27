package com.abhinav.linkedin.api_gateway.config;

import com.abhinav.linkedin.api_gateway.filter.AuthFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder, AuthFilter authFilter) {
        return builder.routes()
                .route("user-service-auth", r -> r
                        .path("/api/v1/auth/**")
                        .filters(f -> f.stripPrefix(2))
                        .uri("lb://USER-SERVICE"))
                .route("user-service", r -> r
                        .path("/api/v1/user/**", "/api/v1/users/**")
                        .filters(f -> f.stripPrefix(2).filter(authFilter.apply(new AuthFilter.Config())))
                        .uri("lb://USER-SERVICE"))
                .route("posts-service", r -> r
                        .path("/api/v1/posts/**", "/api/v1/core/**", "/api/v1/likes/**")
                        .filters(f -> f.stripPrefix(2).filter(authFilter.apply(new AuthFilter.Config())))
                        .uri("lb://POSTS-SERVICE"))
                .route("connection-service", r -> r
                        .path("/api/v1/connections/**")
                        .filters(f -> f.stripPrefix(2).filter(authFilter.apply(new AuthFilter.Config())))
                        .uri("lb://CONNECTION-SERVICE"))
                .build();
    }

    @Bean
    public CorsWebFilter corsWebFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(false);
        config.addAllowedOriginPattern("*");
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        config.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"));
        config.setExposedHeaders(Arrays.asList("Authorization", "X-User-Id", "X-UserId"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsWebFilter(source);
    }
}
