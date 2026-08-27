package com.abhinav.linkedin.notification_service.client;

import com.abhinav.linkedin.notification_service.dto.PersonDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;

@FeignClient(name = "connection-service", path = "/connections")
public interface ConnectionClient {

    @GetMapping("/first-degree")
    List<PersonDto> getFirstDegreeConnections();

    @GetMapping("/{userId}/first-degree")
    List<PersonDto> getFirstDegreeConnections(@PathVariable("userId") Long userId);
}
