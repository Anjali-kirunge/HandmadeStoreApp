package com.handmade.store.service.impl;

import com.handmade.store.entity.OtpVerification;
import com.handmade.store.enums.OtpType;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.repository.OtpVerificationRepository;
import com.handmade.store.service.EmailService;
import com.handmade.store.service.OtpService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class OtpServiceImpl implements OtpService {

    private static final Logger log = LoggerFactory.getLogger(OtpServiceImpl.class);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern OTP_PATTERN = Pattern.compile("^\\d{6}$");

    private final OtpVerificationRepository otpVerificationRepository;
    private final EmailService emailService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.otp.expiry-minutes:10}")
    private long expiryMinutes;

    @Value("${app.otp.resend-cooldown-seconds:60}")
    private long resendCooldownSeconds;

    @Value("${app.otp.expose-in-logs:true}")
    private boolean exposeInLogs;

    public OtpServiceImpl(OtpVerificationRepository otpVerificationRepository, EmailService emailService) {
        this.otpVerificationRepository = otpVerificationRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public void generateOtp(String email, OtpType type) {
        if (type == null) {
            throw new BadRequestException("OTP type is required");
        }
        email = normalizeEmail(email);
        validateEmail(email);

        Optional<OtpVerification> existingOtp = otpVerificationRepository.findByEmailAndTypeAndUsedFalse(email, type);
        if (existingOtp.isPresent()) {
            OtpVerification existing = existingOtp.get();
            if (existing.getCreatedAt() != null
                    && Duration.between(existing.getCreatedAt(), LocalDateTime.now()).getSeconds() < resendCooldownSeconds) {
                throw new BadRequestException(
                        "A verification code was recently sent. Please wait before requesting a new OTP.");
            }
            existing.setUsed(true);
            otpVerificationRepository.save(existing);
        }

        String otp = String.format("%06d", secureRandom.nextInt(100000, 1000000));

        OtpVerification otpVerification = OtpVerification.builder()
                .email(email)
                .otp(otp)
                .type(type)
                .expiryTime(LocalDateTime.now().plusMinutes(expiryMinutes))
                .used(false)
                .build();

        otpVerificationRepository.save(otpVerification);

        if (exposeInLogs) {
            log.info("DEV_OTP [{}] for {} - expires in {} minutes", otp, email, expiryMinutes);
        }

        try {
            emailService.sendOtpEmail(email, otp, typeName(type), expiryMinutes);
        } catch (RuntimeException ex) {
            log.warn("Failed to send OTP email to {}: {}", email, ex.getMessage());
        }
    }

    @Override
    @Transactional
    public boolean verifyOtp(String email, String otp, OtpType type) {
        if (type == null || !OTP_PATTERN.matcher(otp == null ? "" : otp).matches()) {
            return false;
        }
        email = normalizeEmail(email);
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            return false;
        }

        Optional<OtpVerification> optionalOtp = otpVerificationRepository.findByEmailAndTypeAndUsedFalse(email, type);

        if (optionalOtp.isEmpty()) {
            return false;
        }

        OtpVerification otpVerification = optionalOtp.get();

        if (otpVerification.isUsed()) {
            return false;
        }

        if (LocalDateTime.now().isAfter(otpVerification.getExpiryTime())) {
            return false;
        }

        if (!otpVerification.getOtp().equals(otp)) {
            return false;
        }

        otpVerification.setUsed(true);
        otpVerificationRepository.save(otpVerification);

        return true;
    }

    private void validateEmail(String email) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("A valid email address is required");
        }
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private String typeName(OtpType type) {
        switch (type) {
            case PASSWORD_RESET:
                return "Password Reset";
            case EMAIL_VERIFICATION:
                return "Email Verification";
            case REGISTRATION:
            default:
                return "Registration";
        }
    }
}
