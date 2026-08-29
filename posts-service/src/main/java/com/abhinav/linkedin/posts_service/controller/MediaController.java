package com.abhinav.linkedin.posts_service.controller;

import com.abhinav.linkedin.posts_service.exception.BadRequestException;
import com.abhinav.linkedin.posts_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.posts_service.service.S3StorageService;
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
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping({"/posts/media", "/core/posts/media", "/media"})
@RequiredArgsConstructor
@Slf4j
public class MediaController {

    private final S3StorageService s3StorageService;
    private static final String UPLOAD_DIR = "uploads/posts";
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    @jakarta.annotation.PostConstruct
    public void init() {
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
        String fileUrl;
        try {
            fileUrl = s3StorageService.uploadFile("posts", safeFilename, file);
            log.info("Uploaded post media with URL: {}", fileUrl);
        } catch (IOException e) {
            log.error("Failed to store media file: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to store media file: " + e.getMessage());
        }

        return ResponseEntity.ok(Map.of("url", fileUrl));
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<Map<String, Object>> uploadMultiplePostMedia(@RequestParam("files") List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            throw new BadRequestException("No files were uploaded");
        }

        if (files.size() > 4) {
            throw new BadRequestException("Maximum 4 images allowed per post");
        }

        List<String> uploadedUrls = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) continue;

            if (file.getSize() > 15 * 1024 * 1024) {
                throw new BadRequestException("File '" + file.getOriginalFilename() + "' exceeds 15MB size limit");
            }

            String originalFilename = file.getOriginalFilename();
            String extension = "jpg";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
            }

            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new BadRequestException("Unsupported image format: " + extension + ". Allowed: JPG, PNG, WEBP, GIF");
            }

            String safeFilename = UUID.randomUUID().toString().replace("-", "") + "." + extension;
            try {
                String fileUrl = s3StorageService.uploadFile("posts", safeFilename, file);
                uploadedUrls.add(fileUrl);
            } catch (IOException e) {
                log.error("Failed to upload image: {}", e.getMessage(), e);
                throw new BadRequestException("Failed to upload image: " + e.getMessage());
            }
        }

        log.info("Uploaded {} media files to S3 / CloudFront CDN", uploadedUrls.size());
        return ResponseEntity.ok(Map.of(
                "urls", uploadedUrls,
                "url", uploadedUrls.isEmpty() ? "" : uploadedUrls.get(0)
        ));
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
