package com.abhinav.linkedin.notification_service.auth;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class FeignClientInterceptor implements RequestInterceptor {

    @Override
    public void apply(RequestTemplate template) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId != null) {
            template.header("X-User-Id", String.valueOf(userId));
            template.header("X-UserId", String.valueOf(userId));
        }
    }
}
