package com.handmade.store.service.impl;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.review.ReviewRequest;
import com.handmade.store.dto.review.ReviewResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.Review;
import com.handmade.store.entity.User;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.ReviewRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             ProductRepository productRepository,
                             UserRepository userRepository,
                             OrderRepository orderRepository) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
    }

    @Override
    @Transactional
    public ReviewResponse addReview(String email, Long productId, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        if (!hasUserPurchasedAndDelivered(user.getId(), productId)) {
            throw new BadRequestException("You can only review products you have purchased and received");
        }

        if (reviewRepository.existsByProductIdAndUserId(productId, user.getId())) {
            throw new BadRequestException("You have already reviewed this product");
        }

        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(request.getRating())
                .comment(request.getComment())
                .images(request.getImages() != null ? request.getImages() : new java.util.HashSet<>())
                .build();

        review = reviewRepository.save(review);
        updateProductRating(productId);

        return mapToReviewResponse(review);
    }

    @Override
    public PageResponse<ReviewResponse> getReviewsByProduct(Long productId, int page, int size) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product", "id", productId);
        }

        Page<Review> reviewPage = reviewRepository.findByProductId(productId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.<ReviewResponse>builder()
                .content(reviewPage.getContent().stream().map(this::mapToReviewResponse).toList())
                .pageNumber(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .last(reviewPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long id, String email, ReviewRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only update your own reviews");
        }

        review.setRating(request.getRating());
        if (request.getComment() != null) {
            review.setComment(request.getComment());
        }
        if (request.getImages() != null) {
            review.setImages(request.getImages());
        }

        review = reviewRepository.save(review);
        updateProductRating(review.getProduct().getId());

        return mapToReviewResponse(review);
    }

    @Override
    @Transactional
    public Map<String, Object> deleteReview(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));

        if (!review.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You can only delete your own reviews");
        }

        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);
        updateProductRating(productId);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Review deleted successfully");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> deleteReviewAsAdmin(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "id", id));

        Long productId = review.getProduct().getId();
        reviewRepository.delete(review);
        updateProductRating(productId);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Review deleted successfully");
        return result;
    }

    @Override
    public Map<String, Object> canReview(String email, Long productId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        boolean purchased = hasUserPurchasedAndDelivered(user.getId(), productId);
        boolean alreadyReviewed = reviewRepository.existsByProductIdAndUserId(productId, user.getId());

        Map<String, Object> result = new HashMap<>();
        result.put("canReview", purchased && !alreadyReviewed);
        result.put("hasPurchased", purchased);
        result.put("alreadyReviewed", alreadyReviewed);
        return result;
    }

    @Override
    public PageResponse<ReviewResponse> getAllReviews(int page, int size) {
        Page<Review> reviewPage = reviewRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.<ReviewResponse>builder()
                .content(reviewPage.getContent().stream().map(this::mapToReviewResponse).toList())
                .pageNumber(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .totalElements(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .last(reviewPage.isLast())
                .build();
    }

    private boolean hasUserPurchasedAndDelivered(Long userId, Long productId) {
        return orderRepository.countPurchasedAndDeliveredProduct(userId, productId) > 0;
    }

    private void updateProductRating(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));

        Double averageRating = reviewRepository.getAverageRatingByProductId(productId);
        long reviewCount = reviewRepository.countByProductId(productId);

        product.setRating(averageRating != null
                ? BigDecimal.valueOf(averageRating).setScale(2, RoundingMode.HALF_UP).doubleValue()
                : 0.0);
        product.setReviewCount((int) reviewCount);
        productRepository.save(product);
    }

    private ReviewResponse mapToReviewResponse(Review review) {
        UserResponse userResponse = UserResponse.builder()
                .id(review.getUser().getId())
                .firstName(review.getUser().getFirstName())
                .lastName(review.getUser().getLastName())
                .email(review.getUser().getEmail())
                .phone(review.getUser().getPhone())
                .avatar(review.getUser().getAvatar())
                .role(review.getUser().getRole())
                .enabled(review.getUser().isEnabled())
                .createdAt(review.getUser().getCreatedAt())
                .build();

        return ReviewResponse.builder()
                .id(review.getId())
                .user(userResponse)
                .product(buildProductResponse(review.getProduct()))
                .rating(review.getRating())
                .comment(review.getComment())
                .images(review.getImages())
                .createdAt(review.getCreatedAt())
                .build();
    }

    private ProductResponse buildProductResponse(Product product) {
        if (product == null) {
            return null;
        }

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
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .isFeatured(product.isFeatured())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
