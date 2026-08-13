package com.handmade.store.controller;

import com.handmade.store.enums.OtpType;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.service.OtpService;
import com.handmade.store.util.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/v1/otp")
public class OtpController {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern OTP_PATTERN = Pattern.compile("^\\d{6}$");

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        OtpType type = parseType(request.get("type"));

        if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new BadRequestException("A valid email address is required");
        }

        otpService.generateOtp(email, type);
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email", null));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String otp = request.get("otp");
        OtpType type = parseType(request.get("type"));

        if (email == null || !EMAIL_PATTERN.matcher(email.trim()).matches()) {
            throw new BadRequestException("A valid email address is required");
        }
        if (otp == null || !OTP_PATTERN.matcher(otp.trim()).matches()) {
            throw new BadRequestException("OTP must be 6 digits");
        }

        boolean verified = otpService.verifyOtp(email, otp, type);
        if (verified) {
            return ResponseEntity.ok(ApiResponse.success("OTP verified successfully", null));
        }
        throw new BadRequestException("Invalid or expired OTP");
    }

    private OtpType parseType(String type) {
        if (type == null) {
            throw new BadRequestException("OTP type is required");
        }
        try {
            return OtpType.valueOf(type);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid OTP type");
        }
    }
}
