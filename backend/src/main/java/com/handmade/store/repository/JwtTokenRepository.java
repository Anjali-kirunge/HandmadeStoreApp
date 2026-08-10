package com.handmade.store.repository;

import com.handmade.store.entity.JwtToken;
import com.handmade.store.entity.User;
import com.handmade.store.enums.TokenType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface JwtTokenRepository extends JpaRepository<JwtToken, Long> {

    Optional<JwtToken> findByToken(String token);

    Optional<JwtToken> findByTokenAndRevokedFalse(String token);

    List<JwtToken> findByUserAndRevokedFalse(User user);

    Optional<JwtToken> findByUserAndTokenTypeAndRevokedFalse(User user, TokenType tokenType);

    long countByUserAndRevokedFalse(User user);

    @Modifying
    @Query("UPDATE JwtToken t SET t.revoked = true, t.logoutTime = :now WHERE t.user = :user AND t.revoked = false")
    void revokeAllForUser(@Param("user") User user, @Param("now") LocalDateTime now);

    @Modifying
    @Query("UPDATE JwtToken t SET t.expired = true WHERE t.expiresAt < :now AND t.revoked = false")
    void markExpiredBefore(@Param("now") LocalDateTime now);
}
