package com.handmade.store.service;

import com.handmade.store.dto.cart.CartRequest;
import com.handmade.store.dto.cart.CartResponse;

import java.util.Map;

public interface CartService {

    CartResponse getCart(String email);

    CartResponse addToCart(String email, CartRequest request);

    CartResponse updateCartItem(String email, Long productId, int quantity);

    Map<String, Object> removeFromCart(String email, Long productId);

    Map<String, Object> clearCart(String email);
}
