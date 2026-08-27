package com.abhinav.linkedin.connection_service.controller;

import com.abhinav.linkedin.connection_service.auth.UserContextHolder;
import com.abhinav.linkedin.connection_service.entity.Person;
import com.abhinav.linkedin.connection_service.exception.BadRequestException;
import com.abhinav.linkedin.connection_service.service.ConnectionService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/core", "/connections"})
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;

    private Long extractUserId(HttpServletRequest request) {
        Long userId = UserContextHolder.getCurrentUserId();
        if (userId == null && request != null) {
            String header = request.getHeader("X-User-Id");
            if (header == null || header.isBlank()) {
                header = request.getHeader("X-UserId");
            }
            if (header != null && !header.isBlank()) {
                try {
                    userId = Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return userId;
    }

    private Long requireUserId(HttpServletRequest request) {
        Long userId = extractUserId(request);
        if (userId == null) {
            throw new BadRequestException("User ID is missing in request headers");
        }
        return userId;
    }

    @GetMapping("/first-degree")
    public ResponseEntity<List<Person>> getMyFirstConnections(HttpServletRequest request) {
        Long userId = requireUserId(request);
        return ResponseEntity.ok(connectionService.getFirstDegreeConnections(userId));
    }

    @GetMapping("/{userId}/first-degree")
    public ResponseEntity<List<Person>> getFirstConnections(@PathVariable Long userId) {
        return ResponseEntity.ok(connectionService.getFirstDegreeConnections(userId));
    }

    @GetMapping("/check/{userId}")
    public ResponseEntity<Boolean> areConnected(
            @PathVariable Long userId,
            HttpServletRequest request) {

        Long currentUserId = requireUserId(request);
        return ResponseEntity.ok(connectionService.areConnected(currentUserId, userId));
    }

    @GetMapping("/requests")
    public ResponseEntity<List<Person>> getPendingRequests(HttpServletRequest request) {
        Long currentUserId = requireUserId(request);
        return ResponseEntity.ok(connectionService.getPendingRequests(currentUserId));
    }

    @PostMapping("/request/{receiverId}")
    public ResponseEntity<Void> sendConnectionRequest(
            @PathVariable Long receiverId,
            HttpServletRequest request) {

        Long senderId = requireUserId(request);
        connectionService.sendConnectionRequest(senderId, receiverId);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @PostMapping("/accept/{senderId}")
    public ResponseEntity<Void> acceptConnectionRequest(
            @PathVariable Long senderId,
            HttpServletRequest request) {

        Long receiverId = requireUserId(request);
        connectionService.acceptConnectionRequest(receiverId, senderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reject/{senderId}")
    public ResponseEntity<Void> rejectConnectionRequest(
            @PathVariable Long senderId,
            HttpServletRequest request) {

        Long receiverId = requireUserId(request);
        connectionService.rejectConnectionRequest(receiverId, senderId);
        return ResponseEntity.ok().build();
    }
}
