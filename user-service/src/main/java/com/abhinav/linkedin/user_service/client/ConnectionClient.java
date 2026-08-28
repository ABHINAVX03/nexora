package com.abhinav.linkedin.user_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "connection-service")
public interface ConnectionClient {

    @GetMapping("/connections/check/{userId1}/{userId2}")
    Boolean areConnectedBetween(
            @PathVariable("userId1") Long userId1,
            @PathVariable("userId2") Long userId2
    );
}
