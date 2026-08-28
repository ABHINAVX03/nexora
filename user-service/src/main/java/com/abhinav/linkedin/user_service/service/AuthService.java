package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.*;
import com.abhinav.linkedin.user_service.entity.User;
import com.abhinav.linkedin.user_service.event.ProfileViewedEvent;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.user_service.repository.UserRepository;
import com.abhinav.linkedin.user_service.utils.PasswordUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ModelMapper modelMapper;
    private final JwtService jwtService;
    private final KafkaTemplate<Long, Object> kafkaTemplate;

    private static final String AVATAR_UPLOAD_DIR = "uploads/avatars";
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");

    @Value("${app.kafka.topics.profile-viewed:profile-viewed-topic}")
    private String profileViewedTopic;

    @Cacheable(value = "userProfiles", key = "#userId")
    public UserDto getUserById(Long userId) {
        log.info("Fetching user profile from database for userId: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        return modelMapper.map(user, UserDto.class);
    }

    public void recordProfileView(Long viewerId, Long viewedUserId) {
        if (viewerId == null || viewedUserId == null || viewerId.equals(viewedUserId)) {
            return;
        }

        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                User viewer = userRepository.findById(viewerId).orElse(null);
                String viewerName = viewer != null ? viewer.getName() : "A member";

                ProfileViewedEvent event = ProfileViewedEvent.builder()
                        .viewerId(viewerId)
                        .viewedUserId(viewedUserId)
                        .viewerName(viewerName)
                        .build();

                kafkaTemplate.send(profileViewedTopic, viewedUserId, event);
                log.info("Published ProfileViewedEvent: viewer={} ({}) -> viewedUser={}", viewerId, viewerName, viewedUserId);
            } catch (Exception e) {
                log.warn("Non-fatal: Failed to publish ProfileViewedEvent: {}", e.getMessage());
            }
        });
    }

    public UserDto signup(SignUpRequestDto signUpRequestDto) {
        boolean exists = userRepository.existsByEmail(signUpRequestDto.getEmail());

        if (exists) {
            throw new BadRequestException("Email already exists");
        }
        User user = modelMapper.map(signUpRequestDto, User.class);
        user.setPassword(PasswordUtil.hashPassword(signUpRequestDto.getPassword()));

        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserDto.class);
    }

    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        User user = userRepository.findByEmail(loginRequestDto.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with this email: " + loginRequestDto.getEmail()));

        boolean passwordMatch = PasswordUtil.checkPassword(
                loginRequestDto.getPassword(),
                user.getPassword()
        );

        if (!passwordMatch) {
            throw new BadRequestException("Incorrect password");
        }

        String accessToken = jwtService.generateAccessToken(user.getId());
        String refreshToken = jwtService.generateRefreshToken(user.getId());

        return new LoginResponseDto(accessToken, refreshToken);
    }

    public String refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }

        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        Long userId = jwtService.getUserIdFromToken(refreshToken);
        return jwtService.generateAccessToken(userId);
    }

    @CacheEvict(value = "userProfiles", key = "#userId")
    public UserDto updateUserProfile(Long userId, UserProfileUpdateRequestDto requestDto) {
        log.info("Updating user profile for userId: {}", userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (requestDto.getName() != null && !requestDto.getName().isBlank()) {
            user.setName(requestDto.getName().trim());
        }
        if (requestDto.getHeadline() != null) {
            user.setHeadline(requestDto.getHeadline().trim());
        }
        if (requestDto.getBio() != null) {
            user.setBio(requestDto.getBio().trim());
        }
        if (requestDto.getLocation() != null) {
            user.setLocation(requestDto.getLocation().trim());
        }
        if (requestDto.getAvatarUrl() != null) {
            user.setAvatarUrl(requestDto.getAvatarUrl().trim());
        }

        User updatedUser = userRepository.save(user);
        return modelMapper.map(updatedUser, UserDto.class);
    }

    @CacheEvict(value = "userProfiles", key = "#userId")
    public UserDto uploadAvatar(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded avatar file is empty");
        }

        if (file.getSize() > 10 * 1024 * 1024) { // 10MB limit
            throw new BadRequestException("Avatar file size exceeds maximum limit of 10MB");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF");
        }

        String safeFilename = "avatar_" + userId + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
        Path targetPath = Paths.get(AVATAR_UPLOAD_DIR, safeFilename);

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Saved avatar image for user {} to: {}", userId, targetPath.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to store avatar image: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to save avatar image file: " + e.getMessage());
        }

        String avatarUrl = "/api/v1/users/avatar/files/" + safeFilename;
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setAvatarUrl(avatarUrl);
        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserDto.class);
    }

    public List<UserDto> searchUsers(String query) {
        log.info("Searching users with query: '{}'", query);
        if (query == null || query.trim().isBlank()) {
            return userRepository.findAll().stream()
                    .map(u -> modelMapper.map(u, UserDto.class))
                    .collect(Collectors.toList());
        }

        String trimmed = query.trim();
        try {
            Long id = Long.parseLong(trimmed);
            Optional<User> byId = userRepository.findById(id);
            if (byId.isPresent()) {
                UserDto dto = modelMapper.map(byId.get(), UserDto.class);
                return List.of(dto);
            }
        } catch (NumberFormatException ignored) {
        }

        List<User> users = userRepository.searchUsers(trimmed);
        return users.stream()
                .map(u -> modelMapper.map(u, UserDto.class))
                .collect(Collectors.toList());
    }
}