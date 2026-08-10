package com.handmade.store.service;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.user.ChangePasswordRequest;
import com.handmade.store.dto.user.UpdateProfileRequest;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.enums.Role;

import java.util.Map;

public interface UserService {

    UserResponse getCurrentUser(String email);

    UserResponse updateProfile(String email, UpdateProfileRequest request);

    Map<String, Object> changePassword(String email, ChangePasswordRequest request);

    PageResponse<UserResponse> getAllUsers(int page, int size);

    PageResponse<UserResponse> searchUsers(String keyword, int page, int size);

    UserResponse getUserById(Long id);

    UserResponse updateUserRole(Long userId, com.handmade.store.enums.Role role);
    UserResponse updateUserAsAdmin(Long userId, com.handmade.store.dto.user.UserUpdateRequest request);

    UserResponse toggleUserEnabled(Long id);

    Map<String, Object> deleteUser(Long id);
}
