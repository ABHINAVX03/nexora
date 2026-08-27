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
            @Value("${jwt.secret:${jwt.secretKey:ZGVvbnZrbDNudmNvM3Judm8zbnZsbTNvdmp2bGVudmxlbW9rZXZvZXZtb2Zzb21lc2VjcmV0}}") String secret,
            @Value("${jwt.access-token-expiration:31536000000}") long accessTokenExpiration, // 1 year default
            @Value("${jwt.refresh-token-expiration:315360000000}") long refreshTokenExpiration // 10 years default
    ) {
        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(secret)
        );

        this.accessTokenExpiration = accessTokenExpiration;
        this.refreshTokenExpiration = refreshTokenExpiration;
    }

    public String generateAccessToken(Long userId) {
        return generateToken(userId, accessTokenExpiration, "ACCESS");
    }

    public String generateRefreshToken(Long userId) {
        return generateToken(userId, refreshTokenExpiration, "REFRESH");
    }

    private String generateToken(
            Long userId,
            long expirationTime,
            String tokenType
    ) {
        Date now = new Date();

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("type", tokenType)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationTime))
                .signWith(secretKey)
                .compact();
    }

    public Long getUserIdFromToken(String token) {
        Claims claims = getClaims(token);
        return Long.valueOf(claims.getSubject());
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