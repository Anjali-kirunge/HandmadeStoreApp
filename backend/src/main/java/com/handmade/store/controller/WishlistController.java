package com.handmade.store.controller;

import com.handmade.store.dto.wishlist.WishlistRequest;
import com.handmade.store.dto.wishlist.WishlistResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.WishlistService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/wishlist")
@CrossOrigin(origins = "http://localhost:5173")
public class WishlistController {

    private final WishlistService wishlistService;

    public WishlistController(WishlistService wishlistService) {
        this.wishlistService = wishlistService;
    }

    @GetMapping
    public ResponseEntity<WishlistResponse> getWishlist(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        WishlistResponse response = wishlistService.getWishlist(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<WishlistResponse> addToWishlist(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid WishlistRequest request) {
        WishlistResponse response = wishlistService.addToWishlist(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> removeFromWishlist(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long productId) {
        Map<String, Object> response = wishlistService.removeFromWishlist(currentUser.getUsername(), productId);
        return ResponseEntity.ok(response);
    }
}
