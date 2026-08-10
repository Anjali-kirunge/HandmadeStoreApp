package com.handmade.store.service;

import com.handmade.store.entity.User;

public interface JwtTokenService {

    void saveAccessToken(User user, String token);

    void saveRefreshToken(User user, String token);

    boolean isTokenActive(String token);

    boolean isRefreshTokenActive(String token);

    void revokeToken(String token);

    void revokeAllForUser(User user);
}
