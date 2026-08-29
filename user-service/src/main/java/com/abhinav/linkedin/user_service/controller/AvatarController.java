package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.UserDto;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ForbiddenException;
import com.abhinav.linkedin.user_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.user_service.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping({"/users", "/core/users"})
@RequiredArgsConstructor
@Slf4j
public class AvatarController {

    private final AuthService authService;
    private static final String AVATAR_UPLOAD_DIR = "uploads/avatars";
    private static final String BANNER_UPLOAD_DIR = "uploads/banners";

    @jakarta.annotation.PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(AVATAR_UPLOAD_DIR));
            Files.createDirectories(Paths.get(BANNER_UPLOAD_DIR));
            log.info("Initialized media storage directories: {}, {}", AVATAR_UPLOAD_DIR, BANNER_UPLOAD_DIR);
        } catch (IOException e) {
            log.error("Failed to initialize media storage directories: {}", e.getMessage());
        }
    }

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

    @PostMapping("/{userId}/avatar/upload")
    public ResponseEntity<UserDto> uploadAvatar(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        Long callerId = extractCallerUserId(request);
        if (callerId == null) {
            throw new BadRequestException("Authentication required to upload avatar");
        }
        if (!callerId.equals(userId)) {
            log.warn("IDOR attempt: caller {} attempted to upload avatar for user {}", callerId, userId);
            throw new ForbiddenException("You are not authorized to change another member's avatar");
        }

        UserDto updatedUser = authService.uploadAvatar(userId, file);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/avatar/files/{filename}")
    public ResponseEntity<Resource> getAvatarFile(@PathVariable String filename) {
        return serveFile(AVATAR_UPLOAD_DIR, filename, "Avatar");
    }

    @PostMapping("/{userId}/banner/upload")
    public ResponseEntity<UserDto> uploadBanner(
            @PathVariable Long userId,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request
    ) {
        Long callerId = extractCallerUserId(request);
        if (callerId == null) {
            throw new BadRequestException("Authentication required to upload banner");
        }
        if (!callerId.equals(userId)) {
            log.warn("IDOR attempt: caller {} attempted to upload banner for user {}", callerId, userId);
            throw new ForbiddenException("You are not authorized to change another member's banner");
        }

        UserDto updatedUser = authService.uploadBanner(userId, file);
        return ResponseEntity.ok(updatedUser);
    }

    @GetMapping("/banner/files/{filename}")
    public ResponseEntity<Resource> getBannerFile(@PathVariable String filename) {
        return serveFile(BANNER_UPLOAD_DIR, filename, "Banner");
    }

    private ResponseEntity<Resource> serveFile(String uploadDir, String filename, String typeName) {
        String safeName = Paths.get(filename).getFileName().toString();
        Path filePath = Paths.get(uploadDir, safeName);
        File file = filePath.toFile();

        if (!file.exists() || !file.isFile()) {
            throw new ResourceNotFoundException(typeName + " file not found: " + filename);
        }

        Resource resource = new FileSystemResource(file);
        String contentType = "application/octet-stream";
        try {
            String probe = Files.probeContentType(filePath);
            if (probe != null) {
                contentType = probe;
            }
        } catch (IOException ignored) {
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=31536000")
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}
