package com.handmade.store.service.impl;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.coupon.CouponResponse;
import com.handmade.store.dto.order.AdminOrderResponse;
import com.handmade.store.dto.order.OrderItemResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.search.GlobalSearchResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Category;
import com.handmade.store.entity.Coupon;
import com.handmade.store.entity.Order;
import com.handmade.store.entity.OrderItem;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.repository.CategoryRepository;
import com.handmade.store.repository.CouponRepository;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.AdminSearchService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminSearchServiceImpl implements AdminSearchService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final CategoryRepository categoryRepository;
    private final CouponRepository couponRepository;

    public AdminSearchServiceImpl(ProductRepository productRepository,
                                  UserRepository userRepository,
                                  OrderRepository orderRepository,
                                  CategoryRepository categoryRepository,
                                  CouponRepository couponRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.categoryRepository = categoryRepository;
        this.couponRepository = couponRepository;
    }

    @Override
    public GlobalSearchResponse globalSearch(String keyword, int limit) {
        if (keyword == null || keyword.isBlank()) {
            return GlobalSearchResponse.builder()
                    .products(Collections.emptyList())
                    .users(Collections.emptyList())
                    .orders(Collections.emptyList())
                    .categories(Collections.emptyList())
                    .coupons(Collections.emptyList())
                    .totalResults(0)
                    .build();
        }

        String term = keyword.trim();
        int size = limit > 0 && limit <= 50 ? limit : 10;

        List<ProductResponse> products = productRepository.findInventory(term, null, false, 0, PageRequest.of(0, size))
                .getContent().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());

        List<UserResponse> users = userRepository.searchUsers(term, PageRequest.of(0, size))
                .getContent().stream()
                .map(this::mapToUserResponse)
                .collect(Collectors.toList());

        List<AdminOrderResponse> orders = orderRepository.searchOrders(term, null, PageRequest.of(0, size))
                .getContent().stream()
                .map(this::mapToAdminOrderResponse)
                .collect(Collectors.toList());

        List<CategoryResponse> categories = categoryRepository.searchCategories(term, PageRequest.of(0, size))
                .getContent().stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());

        List<CouponResponse> coupons = couponRepository.searchCoupons(term, PageRequest.of(0, size))
                .getContent().stream()
                .map(this::mapToCouponResponse)
                .collect(Collectors.toList());

        long totalResults = products.size() + users.size() + orders.size()
                + categories.size() + coupons.size();

        return GlobalSearchResponse.builder()
                .products(products)
                .users(users)
                .orders(orders)
                .categories(categories)
                .coupons(coupons)
                .totalResults(totalResults)
                .build();
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .parentCategory(category.getParent() != null ? category.getParent().getId() : null)
                .createdAt(category.getCreatedAt())
                .build();
    }

    private CouponResponse mapToCouponResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountPercentage(coupon.getDiscountPercentage().doubleValue())
                .maxDiscount(coupon.getMaxDiscount())
                .minPurchase(coupon.getMinPurchase())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .active(coupon.isActive())
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

        UserResponse sellerResponse = null;
        if (product.getSeller() != null) {
            sellerResponse = mapToUserResponse(product.getSeller());
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
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

    private AdminOrderResponse mapToAdminOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> {
                    Product p = item.getProduct();
                    return OrderItemResponse.builder()
                            .id(item.getId())
                            .product(mapToProductResponse(p))
                            .quantity(item.getQuantity())
                            .price(item.getPrice())
                            .subtotal(item.getPrice())
                            .build();
                })
                .collect(Collectors.toList());

        return AdminOrderResponse.builder()
                .id(order.getId())
                .user(order.getUser() != null ? mapToUserResponse(order.getUser()) : null)
                .items(items)
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .build();
    }
}
