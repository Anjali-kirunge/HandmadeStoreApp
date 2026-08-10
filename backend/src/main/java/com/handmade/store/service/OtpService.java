package com.handmade.store.service;

import com.handmade.store.enums.OtpType;

public interface OtpService {

    void generateOtp(String email, OtpType type);

    boolean verifyOtp(String email, String otp, OtpType type);
}
