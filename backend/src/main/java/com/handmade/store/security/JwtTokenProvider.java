package com.handmade.store.security;

import com.handmade.store.entity.User;
import com.handmade.store.repository.UserRepository;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenProvider {

    private final UserRepository userRepository;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    @Value("${jwt.refresh.expiration}")
    private long jwtRefreshExpiration;

    public JwtTokenProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateAccessToken(String email) {
        return generateToken(email, true);
    }

    public String generateRefreshToken(String email) {
        return generateToken(email, false);
    }

    private String generateToken(String email, boolean isAccess) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
        long expiration = isAccess ? jwtExpiration : jwtRefreshExpiration;

        JwtBuilder builder = Jwts.builder()
                .id(UUID.randomUUID().toString())
                .subject(email)
                .claim("tokenType", isAccess ? "ACCESS" : "REFRESH")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration));

        if (isAccess) {
            builder.claim("role", user.getRole().name());
        }

        return builder.signWith(getSigningKey()).compact();
    }

    public String getEmailFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    public String getRoleFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.get("role", String.class);
    }

    public Date getExpirationFromToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getExpiration();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
