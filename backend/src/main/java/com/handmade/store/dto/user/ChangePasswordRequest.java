package com.handmade.store.dto.user;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequest {

    private String currentPassword;

    @Size(min = 6, message = "New password must be at least 6 characters long")
    private String newPassword;
}
