package com.abhinav.linkedin.api_gateway.config;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

/**
 * Rate limiter configuration for the API Gateway.
 * Uses client IP address as the rate limiting key.
 * Backed by Redis via Spring Cloud Gateway's RequestRateLimiter filter.
 */
@Configuration
public class RateLimiterConfig {

    @Bean
    public KeyResolver ipKeyResolver() {
        return exchange -> {
            String ip = null;

            // Check X-Forwarded-For header first (for clients behind proxy/load balancer)
            String forwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
            if (forwardedFor != null && !forwardedFor.isBlank()) {
                // Take the first IP in the chain (original client)
                ip = forwardedFor.split(",")[0].trim();
            }

            // Fall back to remote address
            if (ip == null || ip.isBlank()) {
                if (exchange.getRequest().getRemoteAddress() != null) {
                    ip = exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
                }
            }

            return Mono.just(ip != null ? ip : "unknown");
        };
    }
}
