package com.abhinav.linkedin.user_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long accessTokenExpiration;
    private final long refreshTokenExpiration;

    public JwtService(
            @Value("${jwt.secret:${jwt.secretKey:}}") String secret,
            @Value("${jwt.access-token-expiration:1800000}") long accessTokenExpiration, // 30 minutes default
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration // 7 days default
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );

        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(Long userId, String sessionId) {
        return generateToken(userId, sessionId, accessTokenExpiration, "ACCESS");
    }

    public String generateRefreshToken(Long userId, String sessionId) {
        return generateToken(userId, sessionId, refreshTokenExpiration, "REFRESH");
    }

    public String generateAccessToken(Long userId) {
        return generateToken(userId, null, accessTokenExpiration, "ACCESS");
    }

    public String generateRefreshToken(Long userId) {
        return generateToken(userId, null, refreshTokenExpiration, "REFRESH");
    }

    private String generateToken(
            Long userId,
            String sessionId,
            long expirationTime,
            String tokenType
    ) {
        Date now = new Date();

        var builder = Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", tokenType)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationTime))
                .signWith(secretKey);

        if (sessionId != null && !sessionId.isBlank()) {
            builder.claim("sessionId", sessionId);
        }

        return builder.compact();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return Long.valueOf(claims.getSubject());
    }

    public String getSessionIdFromToken(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.get("sessionId", String.class);
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isTokenValid(String token) {
        try {
            Claims claims = getClaims(token);
            return claims.getExpiration().after(new Date());
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isAccessToken(String token) {
        try {
            return "ACCESS".equals(getClaims(token).get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isRefreshToken(String token) {
        try {
            return "REFRESH".equals(getClaims(token).get("type", String.class));
        } catch (Exception e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}