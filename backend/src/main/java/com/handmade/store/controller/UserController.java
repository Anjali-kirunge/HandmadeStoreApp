package com.handmade.store.controller;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.user.ChangePasswordRequest;
import com.handmade.store.dto.user.UpdateProfileRequest;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.enums.Role;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal CustomUserDetails currentUser) {
        UserResponse response = userService.getCurrentUser(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid UpdateProfileRequest request) {
        UserResponse response = userService.updateProfile(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/change-password")
    public ResponseEntity<Map<String, Object>> changePassword(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid ChangePasswordRequest request) {
        Map<String, Object> response = userService.changePassword(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<UserResponse>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<UserResponse> response = userService.getAllUsers(page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        Role role = Role.valueOf(request.get("role"));
        UserResponse response = userService.updateUserRole(id, role);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleUserEnabled(@PathVariable Long id) {
        UserResponse response = userService.toggleUserEnabled(id);
        return ResponseEntity.ok(response);
    }
}
