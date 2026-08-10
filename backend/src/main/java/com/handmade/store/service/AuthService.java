package com.handmade.store.service;

import com.handmade.store.dto.auth.AuthResponse;
import com.handmade.store.dto.auth.ForgotPasswordRequest;
import com.handmade.store.dto.auth.LoginRequest;
import com.handmade.store.dto.auth.RegisterRequest;
import com.handmade.store.dto.auth.ResetPasswordRequest;

import java.util.Map;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    Map<String, Object> forgotPassword(ForgotPasswordRequest request);

    Map<String, Object> resetPassword(ResetPasswordRequest request);

    AuthResponse refreshToken(String refreshToken);

    Map<String, Object> verifyRegistrationOtp(String email, String otp);

    Map<String, Object> resendRegistrationOtp(String email);

    Map<String, Object> logout(String token);
}
