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
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
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
    private final OtpService otpService;
    private final EmailService emailService;
    private final S3StorageService s3StorageService;
    private final StringRedisTemplate stringRedisTemplate;

    private static final String AVATAR_UPLOAD_DIR = "uploads/avatars";
    private static final String BANNER_UPLOAD_DIR = "uploads/banners";
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
        String normalizedEmail = signUpRequestDto.getEmail().trim().toLowerCase();
        boolean exists = userRepository.existsByEmail(normalizedEmail);

        if (exists) {
            throw new BadRequestException("An account with this email address already exists. Please sign in.");
        }

        User user = modelMapper.map(signUpRequestDto, User.class);
        user.setEmail(normalizedEmail);
        user.setPassword(PasswordUtil.hashPassword(signUpRequestDto.getPassword()));
        // New users require OTP verification
        user.setIsEmailVerified(false);

        User savedUser = userRepository.save(user);

        // Generate OTP and dispatch verification email
        try {
            String otp = otpService.generateAndStoreOtp("verify", savedUser.getEmail());
            emailService.sendVerificationEmail(savedUser.getEmail(), savedUser.getName(), otp);
        } catch (Exception e) {
            log.error("Failed to generate/send signup OTP for {}: {}", savedUser.getEmail(), e.getMessage());
        }

        return modelMapper.map(savedUser, UserDto.class);
    }

    public LoginResponseDto login(LoginRequestDto loginRequestDto) {
        String normalizedEmail = loginRequestDto.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "User not found with this email: " + loginRequestDto.getEmail()));

        boolean passwordMatch = PasswordUtil.checkPassword(
                loginRequestDto.getPassword(),
                user.getPassword()
        );

        if (!passwordMatch) {
            throw new BadRequestException("Incorrect password");
        }

        // Check if user is verified (only blocks if explicitly false)
        if (Boolean.FALSE.equals(user.getIsEmailVerified())) {
            // Automatically trigger a fresh OTP if needed
            try {
                String otp = otpService.generateAndStoreOtp("verify", user.getEmail());
                emailService.sendVerificationEmail(user.getEmail(), user.getName(), otp);
            } catch (Exception ignored) {
            }
            throw new BadRequestException("EMAIL_NOT_VERIFIED: Please verify your email with the verification code sent to your inbox.");
        }

        return createSessionAndGenerateTokens(user);
    }

    public LoginResponseDto verifyEmailOtp(VerifyOtpRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

        // Verify OTP against Redis with rate-limiting & single-use check
        otpService.verifyOtp("verify", normalizedEmail, request.getOtp());

        // Mark verified and persist
        user.setIsEmailVerified(true);
        userRepository.save(user);

        // Auto-login upon verification with fresh single active session
        return createSessionAndGenerateTokens(user);
    }

    public void resendVerificationOtp(ResendOtpRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

        if (Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BadRequestException("This account is already verified. Please sign in.");
        }

        String otp = otpService.generateAndStoreOtp("verify", normalizedEmail);
        emailService.sendVerificationEmail(user.getEmail(), user.getName(), otp);
    }

    public void forgotPassword(ForgotPasswordRequestDto request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No Nexora account found with email: " + request.getEmail()));

        String otp = otpService.generateAndStoreOtp("reset", normalizedEmail);
        emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), otp);
    }

    @CacheEvict(value = "userProfiles", allEntries = true)
    public void resetPassword(ResetPasswordRequestDto request) {
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters long.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmail(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("No account found with email: " + request.getEmail()));

        // Verify OTP against Redis
        otpService.verifyOtp("reset", normalizedEmail, request.getOtp());

        // Invalidate all previous sessions upon password reset
        String newSessionId = UUID.randomUUID().toString();
        user.setPassword(PasswordUtil.hashPassword(request.getNewPassword()));
        user.setIsEmailVerified(true);
        user.setCurrentSessionId(newSessionId);
        userRepository.save(user);

        try {
            stringRedisTemplate.opsForValue().set("active_session:" + user.getId(), newSessionId, Duration.ofDays(30));
        } catch (Exception e) {
            log.warn("Failed to update active_session in Redis during password reset for user {}: {}", user.getId(), e.getMessage());
        }

        log.info("Password successfully reset and sessions rotated for user: {}", normalizedEmail);
    }

    public String refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new BadRequestException("Refresh token is required");
        }

        if (!jwtService.isTokenValid(refreshToken) || !jwtService.isRefreshToken(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token");
        }

        Long userId = jwtService.getUserIdFromToken(refreshToken);
        String tokenSessionId = jwtService.getSessionIdFromToken(refreshToken);

        // Validate active session against Redis or DB
        String activeSessionId = null;
        try {
            activeSessionId = stringRedisTemplate.opsForValue().get("active_session:" + userId);
        } catch (Exception e) {
            log.warn("Failed to check active_session from Redis for userId {}: {}", userId, e.getMessage());
        }

        if (activeSessionId == null) {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                activeSessionId = user.getCurrentSessionId();
            }
        }

        // If this token belongs to an old/superseded session, reject refresh!
        if (tokenSessionId != null && activeSessionId != null && !tokenSessionId.equals(activeSessionId)) {
            log.warn("Refresh token rejected for userId {} because session {} is superseded by {}", userId, tokenSessionId, activeSessionId);
            throw new BadRequestException("Session expired. This account has been logged in from another browser or device.");
        }

        String sessionToUse = tokenSessionId != null ? tokenSessionId : activeSessionId;
        return jwtService.generateAccessToken(userId, sessionToUse);
    }

    private LoginResponseDto createSessionAndGenerateTokens(User user) {
        String sessionId = UUID.randomUUID().toString();
        user.setCurrentSessionId(sessionId);
        userRepository.save(user);

        try {
            stringRedisTemplate.opsForValue().set("active_session:" + user.getId(), sessionId, Duration.ofDays(30));
            log.info("Registered active single session for userId: {} (sessionId: {})", user.getId(), sessionId);
        } catch (Exception e) {
            log.warn("Failed to set active_session in Redis for userId {}: {}", user.getId(), e.getMessage());
        }

        String accessToken = jwtService.generateAccessToken(user.getId(), sessionId);
        String refreshToken = jwtService.generateRefreshToken(user.getId(), sessionId);

        return new LoginResponseDto(accessToken, refreshToken);
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
        if (requestDto.getBannerUrl() != null) {
            user.setBannerUrl(requestDto.getBannerUrl().trim());
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
        String avatarUrl;
        try {
            avatarUrl = s3StorageService.uploadFile("avatars", safeFilename, file);
            log.info("Uploaded avatar for user {} with URL: {}", userId, avatarUrl);
        } catch (IOException e) {
            log.error("Failed to store avatar image: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to save avatar image file: " + e.getMessage());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setAvatarUrl(avatarUrl);
        User savedUser = userRepository.save(user);
        return modelMapper.map(savedUser, UserDto.class);
    }

    @CacheEvict(value = "userProfiles", key = "#userId")
    public UserDto uploadBanner(Long userId, MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded banner file is empty");
        }

        if (file.getSize() > 15 * 1024 * 1024) { // 15MB limit
            throw new BadRequestException("Banner file size exceeds maximum limit of 15MB");
        }

        String originalFilename = file.getOriginalFilename();
        String extension = "jpg";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".") + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF");
        }

        String safeFilename = "banner_" + userId + "_" + UUID.randomUUID().toString().substring(0, 8) + "." + extension;
        String bannerUrl;
        try {
            bannerUrl = s3StorageService.uploadFile("banners", safeFilename, file);
            log.info("Uploaded banner for user {} with URL: {}", userId, bannerUrl);
        } catch (IOException e) {
            log.error("Failed to store banner image: {}", e.getMessage(), e);
            throw new BadRequestException("Failed to save banner image file: " + e.getMessage());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        user.setBannerUrl(bannerUrl);
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