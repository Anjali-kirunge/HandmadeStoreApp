package com.handmade.store.service.impl;

import com.handmade.store.dto.auth.AuthResponse;
import com.handmade.store.dto.auth.ForgotPasswordRequest;
import com.handmade.store.dto.auth.LoginRequest;
import com.handmade.store.dto.auth.RegisterRequest;
import com.handmade.store.dto.auth.ResetPasswordRequest;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Cart;
import com.handmade.store.entity.User;
import com.handmade.store.enums.OtpType;
import com.handmade.store.enums.Role;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.TooManyRequestsException;
import com.handmade.store.repository.CartRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.security.JwtTokenProvider;
import com.handmade.store.service.AuthService;
import com.handmade.store.service.JwtTokenService;
import com.handmade.store.service.LoginAttemptService;
import com.handmade.store.service.OtpService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final JwtTokenService jwtTokenService;
    private final OtpService otpService;
    private final LoginAttemptService loginAttemptService;

    // Cache to hold registration details until OTP is verified.
    private final Map<String, RegisterRequest> pendingRegistrations = new ConcurrentHashMap<>();

    public AuthServiceImpl(AuthenticationManager authenticationManager,
                           UserRepository userRepository,
                           CartRepository cartRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider jwtTokenProvider,
                           JwtTokenService jwtTokenService,
                           OtpService otpService,
                           LoginAttemptService loginAttemptService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.jwtTokenService = jwtTokenService;
        this.otpService = otpService;
        this.loginAttemptService = loginAttemptService;
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email).orElse(null);

        if (user != null && user.isEnabled()) {
            throw new BadRequestException("An account with this email already exists. Please login.");
        }

        // Add or overwrite the pending registration in our cache
        pendingRegistrations.put(email, request);

        // Generate and send the OTP
        otpService.generateOtp(email, OtpType.REGISTRATION);

        return AuthResponse.builder()
                .user(null) // No user created yet
                .messageType("Registration initiated. Please verify your email with the OTP sent to activate your account.")
                .otpRequired(true)
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (loginAttemptService.isBlocked(email)) {
            throw new TooManyRequestsException(
                    "Too many failed login attempts. Please try again after 15 minutes.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (DisabledException ex) {
            loginAttemptService.recordFailure(email);
            throw new BadRequestException(
                    "Your account is not verified yet. Please enter the OTP sent to your email to activate your account.");
        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(email);
            throw new BadRequestException("Invalid email or password");
        }

        loginAttemptService.reset(email);
        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password"));

        String token = jwtTokenProvider.generateAccessToken(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        jwtTokenService.revokeAllForUser(user);
        jwtTokenService.saveAccessToken(user, token);
        jwtTokenService.saveRefreshToken(user, refreshToken);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(mapToUserResponse(user))
                .messageType("Login successful")
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Email not found"));

        // Generate and send an OTP for password reset
        otpService.generateOtp(email, OtpType.PASSWORD_RESET);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password reset OTP sent to your email successfully");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> resetPassword(ResetPasswordRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!otpService.verifyOtp(email, request.getOtp(), OtpType.PASSWORD_RESET)) {
            throw new BadRequestException("Invalid or expired OTP. Please try requesting a new one.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        jwtTokenService.revokeAllForUser(user);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password reset successfully");
        return result;
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!StringUtils.hasText(refreshToken)
                || !jwtTokenProvider.validateToken(refreshToken)
                || !jwtTokenService.isRefreshTokenActive(refreshToken)) {
            throw new BadRequestException("Invalid or expired refresh token. Please login again.");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        jwtTokenService.revokeToken(refreshToken);

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getEmail());
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        jwtTokenService.saveAccessToken(user, newAccessToken);
        jwtTokenService.saveRefreshToken(user, newRefreshToken);

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .user(mapToUserResponse(user))
                .messageType("Token refreshed successfully")
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> verifyRegistrationOtp(String email, String otp) {
        email = normalizeEmail(email);

        RegisterRequest pendingRequest = pendingRegistrations.get(email);
        User existingUser = userRepository.findByEmail(email).orElse(null);

        if (existingUser != null && existingUser.isEnabled()) {
            throw new BadRequestException("Your account is already verified. Please login.");
        }

        if (pendingRequest == null) {
            throw new BadRequestException("No pending registration found for this email. Please register again.");
        }

        if (!otpService.verifyOtp(email, otp, OtpType.REGISTRATION)) {
            throw new BadRequestException("Invalid or expired OTP. Please try again or request a new code.");
        }

        // Create the user and cart now that email is verified
        User user = existingUser;
        if (user == null) {
            user = User.builder()
                    .firstName(pendingRequest.getFirstName())
                    .lastName(pendingRequest.getLastName())
                    .email(email)
                    .password(passwordEncoder.encode(pendingRequest.getPassword()))
                    .phone(pendingRequest.getPhone())
                    .role(Role.ROLE_CUSTOMER)
                    .enabled(true)
                    .build();
            user = userRepository.save(user);

            Cart cart = Cart.builder().user(user).build();
            cartRepository.save(cart);
        } else {
            user.setFirstName(pendingRequest.getFirstName());
            user.setLastName(pendingRequest.getLastName());
            user.setPhone(pendingRequest.getPhone());
            user.setPassword(passwordEncoder.encode(pendingRequest.getPassword()));
            user.setEnabled(true);
            userRepository.save(user);
        }

        // Remove from cache
        pendingRegistrations.remove(email);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Email verified successfully. You can now login.");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> resendRegistrationOtp(String email) {
        email = normalizeEmail(email);

        User existingUser = userRepository.findByEmail(email).orElse(null);
        if (existingUser != null && existingUser.isEnabled()) {
            throw new BadRequestException("Your account is already verified. Please login.");
        }

        if (!pendingRegistrations.containsKey(email)) {
            throw new BadRequestException("No pending registration found for this email. Please register again.");
        }

        otpService.generateOtp(email, OtpType.REGISTRATION);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "A new OTP has been sent to your email.");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> logout(String token) {
        if (StringUtils.hasText(token)) {
            try {
                String email = jwtTokenProvider.getEmailFromToken(token);
                userRepository.findByEmail(email).ifPresent(jwtTokenService::revokeAllForUser);
            } catch (RuntimeException ignored) {
                // Best-effort logout: never fail even if the token is already invalid.
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Logged out successfully");
        return result;
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
