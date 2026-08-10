package com.handmade.store.controller;

import com.handmade.store.dto.cart.CartRequest;
import com.handmade.store.dto.cart.CartResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.CartService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/cart")
@CrossOrigin(origins = "http://localhost:5173")
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public ResponseEntity<CartResponse> getCart(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        CartResponse response = cartService.getCart(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<CartResponse> addToCart(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid CartRequest request) {
        CartResponse response = cartService.addToCart(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{productId}")
    public ResponseEntity<CartResponse> updateCartItem(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long productId,
            @RequestParam int quantity) {
        CartResponse response = cartService.updateCartItem(currentUser.getUsername(), productId, quantity);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Map<String, Object>> removeFromCart(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long productId) {
        Map<String, Object> response = cartService.removeFromCart(currentUser.getUsername(), productId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> clearCart(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        Map<String, Object> response = cartService.clearCart(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }
}
