package com.abhinav.linkedin.user_service.controller;

import com.abhinav.linkedin.user_service.dto.*;
import com.abhinav.linkedin.user_service.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<UserDto> signup(@RequestBody SignUpRequestDto signUpRequestDto) {
        UserDto userDto = authService.signup(signUpRequestDto);
        return new ResponseEntity<>(userDto, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        LoginResponseDto response = authService.login(loginRequestDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-email")
    public ResponseEntity<LoginResponseDto> verifyEmail(@RequestBody VerifyOtpRequestDto verifyOtpRequestDto) {
        LoginResponseDto response = authService.verifyEmailOtp(verifyOtpRequestDto);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification-otp")
    public ResponseEntity<Map<String, String>> resendVerificationOtp(@RequestBody ResendOtpRequestDto requestDto) {
        authService.resendVerificationOtp(requestDto);
        return ResponseEntity.ok(Map.of("message", "A new verification code has been sent to your email."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody ForgotPasswordRequestDto requestDto) {
        authService.forgotPassword(requestDto);
        return ResponseEntity.ok(Map.of("message", "If an account exists with this email, a reset code has been dispatched."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequestDto requestDto) {
        authService.resetPassword(requestDto);
        return ResponseEntity.ok(Map.of("message", "Password has been reset successfully. Please sign in with your new password."));
    }

    @PostMapping("/refresh")
    public ResponseEntity<String> refreshToken(@RequestBody RefreshTokenRequestDto refreshTokenRequestDto) {
        String newAccessToken = authService.refreshToken(refreshTokenRequestDto.getRefreshToken());
        return ResponseEntity.ok(newAccessToken);
    }
}