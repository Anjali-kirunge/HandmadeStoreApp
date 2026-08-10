package com.handmade.store.service.impl;

import com.handmade.store.dto.cart.CartItemResponse;
import com.handmade.store.dto.cart.CartRequest;
import com.handmade.store.dto.cart.CartResponse;
import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Cart;
import com.handmade.store.entity.CartItem;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.CartItemRepository;
import com.handmade.store.repository.CartRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.CartService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class CartServiceImpl implements CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public CartServiceImpl(CartRepository cartRepository,
                           CartItemRepository cartItemRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    public CartResponse getCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Cart cart = getOrCreateCart(user);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse addToCart(String email, CartRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", request.getProductId()));

        if (product.getStockQuantity() < request.getQuantity()) {
            throw new BadRequestException("Insufficient stock. Available: " + product.getStockQuantity());
        }

        Cart cart = getOrCreateCart(user);

        Optional<CartItem> existingItem = cartItemRepository
                .findByCartIdAndProductId(cart.getId(), product.getId());

        if (existingItem.isPresent()) {
            CartItem item = existingItem.get();
            int newQty = item.getQuantity() + request.getQuantity();
            if (newQty > product.getStockQuantity()) {
                throw new BadRequestException("Insufficient stock. Available: " + product.getStockQuantity());
            }
            item.setQuantity(newQty);
            item.setPrice(product.getDiscountPrice() != null
                    ? product.getDiscountPrice().multiply(BigDecimal.valueOf(newQty))
                    : product.getPrice().multiply(BigDecimal.valueOf(newQty)));
            cartItemRepository.save(item);
        } else {
            CartItem cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .quantity(request.getQuantity())
                    .price(product.getDiscountPrice() != null
                            ? product.getDiscountPrice().multiply(BigDecimal.valueOf(request.getQuantity()))
                            : product.getPrice().multiply(BigDecimal.valueOf(request.getQuantity())))
                    .build();
            cartItemRepository.save(cartItem);
        }

        cart = cartRepository.findById(cart.getId()).orElse(cart);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public CartResponse updateCartItem(String email, Long productId, int quantity) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Cart cart = getOrCreateCart(user);

        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", "productId", productId));

        Product product = cartItem.getProduct();

        if (quantity <= 0) {
            cartItemRepository.delete(cartItem);
        } else {
            if (quantity > product.getStockQuantity()) {
                throw new BadRequestException("Insufficient stock. Available: " + product.getStockQuantity());
            }
            cartItem.setQuantity(quantity);
            cartItem.setPrice(product.getDiscountPrice() != null
                    ? product.getDiscountPrice().multiply(BigDecimal.valueOf(quantity))
                    : product.getPrice().multiply(BigDecimal.valueOf(quantity)));
            cartItemRepository.save(cartItem);
        }

        cart = cartRepository.findById(cart.getId()).orElse(cart);
        return mapToCartResponse(cart);
    }

    @Override
    @Transactional
    public Map<String, Object> removeFromCart(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Cart cart = getOrCreateCart(user);

        CartItem cartItem = cartItemRepository.findByCartIdAndProductId(cart.getId(), productId)
                .orElseThrow(() -> new ResourceNotFoundException("Cart item", "productId", productId));

        cartItemRepository.delete(cartItem);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Item removed from cart");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> clearCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Cart cart = getOrCreateCart(user);
        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Cart cleared successfully");
        return result;
    }

    private Cart getOrCreateCart(User user) {
        return cartRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });
    }

    private CartResponse mapToCartResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::mapToCartItemResponse)
                .toList();

        int totalItems = items.stream()
                .mapToInt(CartItemResponse::getQuantity)
                .sum();

        return CartResponse.builder()
                .id(cart.getId())
                .items(items)
                .totalPrice(cart.getTotalPrice())
                .totalItems(totalItems)
                .build();
    }

    private CartItemResponse mapToCartItemResponse(CartItem item) {
        Product product = item.getProduct();
        ProductResponse productResponse = ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .images(product.getImages())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .isFeatured(product.isFeatured())
                .createdAt(product.getCreatedAt())
                .build();

        return CartItemResponse.builder()
                .id(item.getId())
                .product(productResponse)
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .subtotal(item.getPrice())
                .build();
    }
}
