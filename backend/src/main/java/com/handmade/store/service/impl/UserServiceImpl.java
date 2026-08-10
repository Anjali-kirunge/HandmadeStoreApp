package com.handmade.store.service.impl;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.user.ChangePasswordRequest;
import com.handmade.store.dto.user.UpdateProfileRequest;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.User;
import com.handmade.store.enums.Role;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.CartItemRepository;
import com.handmade.store.repository.CartRepository;
import com.handmade.store.repository.NotificationRepository;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.ReviewRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.repository.WishlistRepository;
import com.handmade.store.service.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final WishlistRepository wishlistRepository;
    private final NotificationRepository notificationRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           OrderRepository orderRepository,
                           CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           WishlistRepository wishlistRepository,
                           NotificationRepository notificationRepository,
                           ReviewRepository reviewRepository,
                           PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.wishlistRepository = wishlistRepository;
        this.notificationRepository = notificationRepository;
        this.reviewRepository = reviewRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }
        if (request.getAvatar() != null) {
            user.setAvatar(request.getAvatar());
        }

        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public Map<String, Object> changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Password changed successfully");
        return result;
    }

    @Override
    public PageResponse<UserResponse> getAllUsers(int page, int size) {
        Page<User> userPage = userRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.<UserResponse>builder()
                .content(userPage.getContent().stream().map(this::mapToUserResponse).toList())
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToUserResponse(user);
    }

    @Override
    public PageResponse<UserResponse> searchUsers(String keyword, int page, int size) {
        Page<User> userPage = userRepository.searchUsers(
                keyword == null || keyword.isBlank() ? null : keyword.trim(),
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.<UserResponse>builder()
                .content(userPage.getContent().stream().map(this::mapToUserResponse).toList())
                .pageNumber(userPage.getNumber())
                .pageSize(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (user.getRole() == Role.ROLE_ADMIN) {
            throw new BadRequestException("Admin accounts cannot be deleted");
        }

        if (orderRepository.countByUserId(id) > 0) {
            throw new BadRequestException(
                    "User has order history and cannot be deleted. Deactivate the account instead.");
        }

        cartRepository.findByUserId(id).ifPresent(cart -> {
            cartItemRepository.findByCartId(cart.getId()).forEach(cartItemRepository::delete);
            cartItemRepository.flush();
            cartRepository.delete(cart);
        });

        wishlistRepository.findByUserId(id).ifPresent(wishlistRepository::delete);
        notificationRepository.findByUserId(id).forEach(notificationRepository::delete);
        reviewRepository.findByUserId(id).forEach(reviewRepository::delete);
        paymentRepository.findByUserId(id).forEach(paymentRepository::delete);

        userRepository.delete(user);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "User deleted successfully");
        return result;
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, Role role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setRole(role);
        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse updateUserAsAdmin(Long userId, com.handmade.store.dto.user.UserUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        
        if (request.getFirstName() != null) user.setFirstName(request.getFirstName());
        if (request.getLastName() != null) user.setLastName(request.getLastName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        
        user = userRepository.save(user);
        return mapToUserResponse(user);
    }

    @Override
    @Transactional
    public UserResponse toggleUserEnabled(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        user.setEnabled(!user.isEnabled());
        user = userRepository.save(user);
        return mapToUserResponse(user);
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
