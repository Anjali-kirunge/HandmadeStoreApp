package com.handmade.store.repository;

import com.handmade.store.entity.OtpVerification;
import com.handmade.store.enums.OtpType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {

    Optional<OtpVerification> findByEmailAndTypeAndUsedFalse(String email, OtpType type);

    void deleteByExpiryTimeBefore(LocalDateTime expiryTime);
}
