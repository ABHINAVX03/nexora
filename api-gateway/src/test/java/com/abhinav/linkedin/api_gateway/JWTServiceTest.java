package com.abhinav.linkedin.api_gateway;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.crypto.SecretKey;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JWTServiceTest {

    private static final String SECRET = "ZGVvbnZrbDNudmNvM3Judm8zbnZsbTNvdmp2bGVudmxlbW9rZXZvZXZtb2Zzb21lc2VjcmV0";
    private JWTService jwtService;
    private SecretKey secretKey;

    @BeforeEach
    void setUp() {
        jwtService = new JWTService(SECRET);
        secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(SECRET));
    }

    private String createToken(Long userId, String type, long expirationMillis) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", type)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMillis))
                .signWith(secretKey)
                .compact();
    }

    @Test
    void testGetUserIdFromToken() {
        String token = createToken(123L, "ACCESS", 60000);
        Long userId = jwtService.getUserIdFromToken(token);
        assertEquals(123L, userId);
    }

    @Test
    void testIsTokenValid_validToken() {
        String token = createToken(123L, "ACCESS", 60000);
        assertTrue(jwtService.isTokenValid(token));
    }

    @Test
    void testIsTokenValid_expiredToken() {
        String token = createToken(123L, "ACCESS", -60000);
        assertFalse(jwtService.isTokenValid(token));
    }

    @Test
    void testIsAccessToken() {
        String accessToken = createToken(123L, "ACCESS", 60000);
        String refreshToken = createToken(123L, "REFRESH", 60000);

        assertTrue(jwtService.isAccessToken(accessToken));
        assertFalse(jwtService.isAccessToken(refreshToken));
    }
}
