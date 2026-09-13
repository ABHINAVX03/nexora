package com.abhinav.linkedin.notification_service.client;

import com.abhinav.linkedin.notification_service.dto.UserDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "user-service")
public interface UserClient {
    @GetMapping("/users/{userId}")
    UserDto getUserById(@PathVariable("userId") Long userId);
}
