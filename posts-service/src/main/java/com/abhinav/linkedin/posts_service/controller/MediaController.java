package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
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
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping({"/posts/media", "/core/posts/media", "/media"})
@Slf4j
public class MediaController {

    private static final String UPLOAD_DIR = "uploads/posts";
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    public MediaController() {
        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) {
            dir.mkdirs();
        }
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadPostMedia(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file is empty");
        }

        if (file.getSize() > 15 * 1024 * 1024) { // 15MB limit
            throw new BadRequestException("File size exceeds maximum allowed limit (15MB)");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF");
        }

        String safeFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        Path targetPath = Paths.get(UPLOAD_DIR, safeFilename);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved post media to: {}", targetPath.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to save uploaded file: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to store media file: " + e.getMessage());
        }

        String fileUrl = "/api/v1/posts/media/files/" + safeFilename;
        return ResponseEntity.ok(Map.of("url", fileUrl));
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> getMediaFile(@PathVariable String filename) {
        // Prevent path traversal
        String safeName = Paths.get(filename).getFileName().toString();
        Path filePath = Paths.get(UPLOAD_DIR, safeName);
        File file = filePath.toFile();

        if (!file.exists() || !file.isFile()) {
            throw new ResourceNotFoundException("Media file not found: " + filename);
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
