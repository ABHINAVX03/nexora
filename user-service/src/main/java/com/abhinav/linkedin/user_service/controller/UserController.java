package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.UserDto;
import com.abhinav.linkedin.user_service.dto.UserProfileUpdateRequestDto;
import com.abhinav.linkedin.user_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserDto> getUserProfile(
            @PathVariable Long userId,
            HttpServletRequest request
    ) {
        String viewerHeader = request.getHeader("X-User-Id");
        if (viewerHeader == null || viewerHeader.isBlank()) {
            viewerHeader = request.getHeader("X-UserId");
        }

        if (viewerHeader != null && !viewerHeader.isBlank()) {
            try {
                Long viewerId = Long.parseLong(viewerHeader.trim());
                if (!viewerId.equals(userId)) {
                    authService.recordProfileView(viewerId, userId);
                }
            } catch (NumberFormatException ignored) {
            }
        }

        UserDto userDto = authService.getUserById(userId);
        return ResponseEntity.ok(userDto);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserDto> updateUserProfile(
            @PathVariable Long userId,
            @RequestBody UserProfileUpdateRequestDto requestDto
    ) {
        UserDto updated = authService.updateUserProfile(userId, requestDto);
        return ResponseEntity.ok(updated);
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam(required = false) String query) {
        List<UserDto> users = authService.searchUsers(query);
        return ResponseEntity.ok(users);
    }
}
