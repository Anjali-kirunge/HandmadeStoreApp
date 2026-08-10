package com.handmade.store.service.impl;

import com.handmade.store.entity.JwtToken;
import com.handmade.store.entity.User;
import com.handmade.store.enums.TokenType;
import com.handmade.store.repository.JwtTokenRepository;
import com.handmade.store.security.JwtTokenProvider;
import com.handmade.store.service.JwtTokenService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtTokenServiceImpl implements JwtTokenService {

    private final JwtTokenRepository jwtTokenRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public JwtTokenServiceImpl(JwtTokenRepository jwtTokenRepository, JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenRepository = jwtTokenRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    @Transactional
    public void saveAccessToken(User user, String token) {
        saveToken(user, token, TokenType.ACCESS, true);
    }

    @Override
    @Transactional
    public void saveRefreshToken(User user, String token) {
        saveToken(user, token, TokenType.REFRESH, false);
    }

    private void saveToken(User user, String token, TokenType type, boolean singleSession) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiresAt = toLocalDateTime(jwtTokenProvider.getExpirationFromToken(token));

        if (singleSession) {
            jwtTokenRepository.revokeAllForUser(user, now);
        } else {
            jwtTokenRepository.findByUserAndTokenTypeAndRevokedFalse(user, TokenType.REFRESH)
                    .ifPresent(existing -> {
                        existing.setRevoked(true);
                        jwtTokenRepository.save(existing);
                    });
        }

        JwtToken jwtToken = JwtToken.builder()
                .user(user)
                .token(token)
                .tokenType(type)
                .expiresAt(expiresAt)
                .revoked(false)
                .expired(expiresAt.isBefore(now))
                .loginTime(now)
                .build();

        jwtTokenRepository.save(jwtToken);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTokenActive(String token) {
        Optional<JwtToken> optional = jwtTokenRepository.findByToken(token);
        if (optional.isEmpty()) {
            return false;
        }
        JwtToken jwtToken = optional.get();
        return !jwtToken.isRevoked()
                && !jwtToken.isExpired()
                && jwtToken.getExpiresAt() != null
                && jwtToken.getExpiresAt().isAfter(LocalDateTime.now());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isRefreshTokenActive(String token) {
        Optional<JwtToken> optional = jwtTokenRepository.findByToken(token);
        if (optional.isEmpty()) {
            return false;
        }
        JwtToken jwtToken = optional.get();
        return jwtToken.getTokenType() == TokenType.REFRESH
                && !jwtToken.isRevoked()
                && !jwtToken.isExpired()
                && jwtToken.getExpiresAt() != null
                && jwtToken.getExpiresAt().isAfter(LocalDateTime.now());
    }

    @Override
    @Transactional
    public void revokeToken(String token) {
        jwtTokenRepository.findByToken(token).ifPresent(existing -> {
            existing.setRevoked(true);
            existing.setLogoutTime(LocalDateTime.now());
            jwtTokenRepository.save(existing);
        });
    }

    @Override
    @Transactional
    public void revokeAllForUser(User user) {
        jwtTokenRepository.revokeAllForUser(user, LocalDateTime.now());
    }

    private LocalDateTime toLocalDateTime(Date date) {
        return Instant.ofEpochMilli(date.getTime())
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }
}
