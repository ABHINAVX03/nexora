package com.abhinav.linkedin.user_service.service;

import com.abhinav.linkedin.user_service.dto.*;
import com.abhinav.linkedin.user_service.entity.User;
import com.abhinav.linkedin.user_service.exception.BadRequestException;
import com.abhinav.linkedin.user_service.exception.ResourceNotFoundException;
import com.abhinav.linkedin.user_service.repository.UserRepository;
import com.abhinav.linkedin.user_service.utils.PasswordUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.modelmapper.ModelMapper;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Spy
    private ModelMapper modelMapper = new ModelMapper();

    @Mock
    private JwtService jwtService;

    @Mock
    private OtpService otpService;

    @Mock
    private EmailService emailService;

    @Mock
    private S3StorageService s3StorageService;

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private KafkaTemplate<Long, Object> kafkaTemplate;

    @InjectMocks
    private AuthService authService;

    @Test
    void getUserById_success() {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        user.setEmail("alice@example.com");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        UserDto userDto = authService.getUserById(1L);

        assertNotNull(userDto);
        assertEquals(1L, userDto.getId());
        assertEquals("Alice", userDto.getName());
        assertEquals("alice@example.com", userDto.getEmail());
    }

    @Test
    void getUserById_notFound_throwsException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.getUserById(99L));
    }

    @Test
    void signup_success() {
        SignUpRequestDto requestDto = new SignUpRequestDto();
        requestDto.setName("Bob");
        requestDto.setEmail("bob@example.com");
        requestDto.setPassword("secret123");

        User savedUser = new User();
        savedUser.setId(2L);
        savedUser.setName("Bob");
        savedUser.setEmail("bob@example.com");

        when(userRepository.existsByEmail("bob@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(otpService.generateAndStoreOtp(anyString(), anyString())).thenReturn("123456");

        UserDto result = authService.signup(requestDto);

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("Bob", result.getName());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void signup_existingEmail_throwsBadRequest() {
        SignUpRequestDto requestDto = new SignUpRequestDto();
        requestDto.setEmail("existing@example.com");

        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.signup(requestDto));
    }

    @Test
    void login_success() {
        LoginRequestDto loginDto = new LoginRequestDto();
        loginDto.setEmail("alice@example.com");
        loginDto.setPassword("password123");

        User user = new User();
        user.setId(1L);
        user.setEmail("alice@example.com");
        user.setPassword(PasswordUtil.hashPassword("password123"));
        user.setIsEmailVerified(true);

        when(userRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);
        when(jwtService.generateAccessToken(eq(1L), anyString())).thenReturn("mock-access-token");
        when(jwtService.generateRefreshToken(eq(1L), anyString())).thenReturn("mock-refresh-token");

        LoginResponseDto response = authService.login(loginDto);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getAccessToken());
        assertEquals("mock-refresh-token", response.getRefreshToken());
        verify(userRepository).save(any(User.class));
    }

    @Test
    void updateUserProfile_success() {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        user.setEmail("alice@example.com");

        UserProfileUpdateRequestDto updateDto = new UserProfileUpdateRequestDto();
        updateDto.setName("Alice Updated");
        updateDto.setHeadline("Tech Lead");
        updateDto.setBio("Building scalable microservices");
        updateDto.setLocation("New York, NY");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        UserDto result = authService.updateUserProfile(1L, updateDto);

        assertNotNull(result);
        assertEquals("Alice Updated", result.getName());
        assertEquals("Tech Lead", result.getHeadline());
        assertEquals("Building scalable microservices", result.getBio());
        assertEquals("New York, NY", result.getLocation());
    }

    @Test
    void searchUsers_success() {
        User user = new User();
        user.setId(1L);
        user.setName("Alice");
        user.setEmail("alice@example.com");

        when(userRepository.searchUsers("alice")).thenReturn(List.of(user));

        List<UserDto> results = authService.searchUsers("alice");

        assertNotNull(results);
        assertEquals(1, results.size());
        assertEquals("Alice", results.get(0).getName());
    }
}
