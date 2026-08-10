package com.handmade.store.dto.auth;

import com.handmade.store.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    private String refreshToken;
    private UserResponse user;
    private String messageType;

    @Builder.Default
    private boolean otpRequired = false;
}
