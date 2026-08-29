package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.UserDto;
import com.abhinav.linkedin.user_service.dto.UserProfileUpdateRequestDto;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ForbiddenException;
import com.abhinav.linkedin.user_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final AuthService authService;

    private Long extractCallerUserId(HttpServletRequest request) {
        if (request != null) {
            String header = request.getHeader("X-User-Id");
            if (header == null || header.isBlank()) {
                header = request.getHeader("X-UserId");
            }
            if (header != null && !header.isBlank()) {
                try {
                    return Long.parseLong(header.trim());
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return null;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUserProfile(
            @PathVariable Long userId,
            HttpServletRequest request
    ) {
        Long viewerId = extractCallerUserId(request);
        if (viewerId != null && !viewerId.equals(userId)) {
            authService.recordProfileView(viewerId, userId);
        }

        UserDto userDto = authService.getUserById(userId);
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDto> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody UserProfileUpdateRequestDto requestDto,
            HttpServletRequest request
    ) {
        Long callerId = extractCallerUserId(request);
        if (callerId == null) {
            throw new BadRequestException("Authentication credentials missing");
        }

        if (!callerId.equals(userId)) {
            log.warn("IDOR attempt blocked: caller {} tried to update profile of user {}", callerId, userId);
            throw new ForbiddenException("You are not authorized to update another member's profile");
        }

        UserDto updated = authService.updateUserProfile(userId, requestDto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam(required = false) String query) {
        List<UserDto> users = authService.searchUsers(query);
        return ResponseEntity.ok(users);
    }
}
