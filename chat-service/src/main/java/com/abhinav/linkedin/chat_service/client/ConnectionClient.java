package com.abhinav.linkedin.chat_service.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "CONNECTION-SERVICE", path = "/connections")
public interface ConnectionClient {

    @GetMapping("/check/{userId}")
    Boolean areConnected(@PathVariable("userId") Long userId);
}
