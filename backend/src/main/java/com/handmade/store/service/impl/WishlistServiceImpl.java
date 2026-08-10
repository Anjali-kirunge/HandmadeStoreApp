package com.handmade.store.service.impl;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.dto.wishlist.WishlistRequest;
import com.handmade.store.dto.wishlist.WishlistResponse;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.entity.Wishlist;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.repository.WishlistRepository;
import com.handmade.store.service.WishlistService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class WishlistServiceImpl implements WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    public WishlistServiceImpl(WishlistRepository wishlistRepository,
                               UserRepository userRepository,
                               ProductRepository productRepository) {
        this.wishlistRepository = wishlistRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
    }

    @Override
    public WishlistResponse getWishlist(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Wishlist wishlist = getOrCreateWishlist(user);
        return mapToWishlistResponse(wishlist);
    }

    @Override
    @Transactional
    public WishlistResponse addToWishlist(String email, WishlistRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        Wishlist wishlist = getOrCreateWishlist(user);

        if (wishlist.getProducts().contains(product)) {
            throw new BadRequestException("Product already in wishlist");
        }

        wishlist.getProducts().add(product);
        wishlist = wishlistRepository.save(wishlist);
        return mapToWishlistResponse(wishlist);
    }

    @Override
    @Transactional
    public Map<String, Object> removeFromWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        Wishlist wishlist = getOrCreateWishlist(user);

        if (!wishlist.getProducts().contains(product)) {
            throw new ResourceNotFoundException("Product", "productId", productId);
        }

        wishlist.getProducts().remove(product);
        wishlistRepository.save(wishlist);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Product removed from wishlist");
        return result;
    }

    private Wishlist getOrCreateWishlist(User user) {
        return wishlistRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Wishlist newWishlist = Wishlist.builder().user(user).build();
                    return wishlistRepository.save(newWishlist);
                });
    }

    private WishlistResponse mapToWishlistResponse(Wishlist wishlist) {
        List<ProductResponse> products = wishlist.getProducts().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());

        return WishlistResponse.builder()
                .id(wishlist.getId())
                .products(products)
                .build();
    }

    private ProductResponse mapToProductResponse(Product product) {
        CategoryResponse categoryResponse = null;
        if (product.getCategory() != null) {
            categoryResponse = CategoryResponse.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .description(product.getCategory().getDescription())
                    .imageUrl(product.getCategory().getImageUrl())
                    .createdAt(product.getCategory().getCreatedAt())
                    .build();
        }

        UserResponse sellerResponse = UserResponse.builder()
                .id(product.getSeller().getId())
                .firstName(product.getSeller().getFirstName())
                .lastName(product.getSeller().getLastName())
                .email(product.getSeller().getEmail())
                .phone(product.getSeller().getPhone())
                .avatar(product.getSeller().getAvatar())
                .role(product.getSeller().getRole())
                .enabled(product.getSeller().isEnabled())
                .createdAt(product.getSeller().getCreatedAt())
                .build();

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .images(product.getImages())
                .category(categoryResponse)
                .seller(sellerResponse)
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .isFeatured(product.isFeatured())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
