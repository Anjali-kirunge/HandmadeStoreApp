package com.handmade.store.service;

import com.handmade.store.dto.wishlist.WishlistRequest;
import com.handmade.store.dto.wishlist.WishlistResponse;

import java.util.Map;

public interface WishlistService {

    WishlistResponse getWishlist(String email);

    WishlistResponse addToWishlist(String email, WishlistRequest request);

    Map<String, Object> removeFromWishlist(String email, Long productId);
}
