package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;

@Service
@Slf4j
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    private static final Duration OTP_EXPIRATION = Duration.ofMinutes(10);
    private static final Duration COOLDOWN_DURATION = Duration.ofSeconds(60);
    private static final int MAX_ATTEMPTS = 5;

    public String generateAndStoreOtp(String purpose, String email) {
        String normalizedEmail = normalizeEmail(email);
        String cooldownKey = "otp:" + purpose + ":cooldown:" + normalizedEmail;
        String otpKey = "otp:" + purpose + ":" + normalizedEmail;
        String attemptsKey = "otp:" + purpose + ":attempts:" + normalizedEmail;

        // 1. Enforce 60-second cooldown to prevent spam
        Boolean hasCooldown = redisTemplate.hasKey(cooldownKey);
        if (Boolean.TRUE.equals(hasCooldown)) {
            Long ttl = redisTemplate.getExpire(cooldownKey);
            long secondsRemaining = (ttl != null && ttl > 0) ? ttl : 60;
            throw new BadRequestException("Please wait " + secondsRemaining + " seconds before requesting a new code.");
        }

        // 2. Generate secure 6-digit OTP
        int code = 100000 + secureRandom.nextInt(900000);
        String plainOtp = String.valueOf(code);

        // 3. Hash OTP before persisting to Redis
        String hashedOtp = hashOtp(plainOtp, normalizedEmail);

        try {
            redisTemplate.opsForValue().set(otpKey, hashedOtp, OTP_EXPIRATION);
            redisTemplate.opsForValue().set(cooldownKey, "active", COOLDOWN_DURATION);
            redisTemplate.delete(attemptsKey);
            log.info("Secure OTP generated for purpose='{}', email='{}', expires in 10 minutes", purpose, normalizedEmail);
        } catch (Exception e) {
            log.error("Redis operation failed while saving OTP: {}", e.getMessage(), e);
            throw new BadRequestException("Service temporarily unable to process OTP. Please try again.");
        }

        return plainOtp;
    }

    public boolean verifyOtp(String purpose, String email, String plainOtp) {
        if (plainOtp == null || plainOtp.trim().length() != 6) {
            throw new BadRequestException("Please enter a valid 6-digit verification code.");
        }

        String normalizedEmail = normalizeEmail(email);
        String otpKey = "otp:" + purpose + ":" + normalizedEmail;
        String attemptsKey = "otp:" + purpose + ":attempts:" + normalizedEmail;

        // 1. Check attempt limit (Rate limiting)
        String attemptsStr = redisTemplate.opsForValue().get(attemptsKey);
        int attempts = (attemptsStr != null) ? Integer.parseInt(attemptsStr) : 0;
        if (attempts >= MAX_ATTEMPTS) {
            redisTemplate.delete(otpKey);
            redisTemplate.delete(attemptsKey);
            throw new BadRequestException("Too many incorrect attempts. This code has been invalidated. Please request a new code.");
        }

        // 2. Retrieve hashed OTP
        String storedHash = redisTemplate.opsForValue().get(otpKey);
        if (storedHash == null) {
            throw new BadRequestException("Verification code has expired or was not requested. Please request a new code.");
        }

        // 3. Hash candidate and compare
        String candidateHash = hashOtp(plainOtp.trim(), normalizedEmail);
        if (!MessageDigest.isEqual(storedHash.getBytes(StandardCharsets.UTF_8), candidateHash.getBytes(StandardCharsets.UTF_8))) {
            long newAttempts = redisTemplate.opsForValue().increment(attemptsKey);
            redisTemplate.expire(attemptsKey, OTP_EXPIRATION);
            long remaining = MAX_ATTEMPTS - newAttempts;
            throw new BadRequestException("Incorrect verification code. " + (remaining > 0 ? remaining + " attempts remaining." : ""));
        }

        // 4. Single-use: Delete OTP and attempts upon successful match
        redisTemplate.delete(otpKey);
        redisTemplate.delete(attemptsKey);
        log.info("OTP successfully verified and invalidated for purpose='{}', email='{}'", purpose, normalizedEmail);
        return true;
    }

    public void clearOtp(String purpose, String email) {
        String normalizedEmail = normalizeEmail(email);
        redisTemplate.delete("otp:" + purpose + ":" + normalizedEmail);
        redisTemplate.delete("otp:" + purpose + ":attempts:" + normalizedEmail);
        redisTemplate.delete("otp:" + purpose + ":cooldown:" + normalizedEmail);
    }

    private String hashOtp(String otp, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt.getBytes(StandardCharsets.UTF_8));
            byte[] hash = digest.digest(otp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
