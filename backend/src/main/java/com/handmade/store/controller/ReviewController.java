package com.handmade.store.controller;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.review.ReviewRequest;
import com.handmade.store.dto.review.ReviewResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping("/product/{productId}")
    public ResponseEntity<ReviewResponse> addReview(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long productId,
            @RequestBody @Valid ReviewRequest request) {
        ReviewResponse response = reviewService.addReview(currentUser.getUsername(), productId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<PageResponse<ReviewResponse>> getReviewsByProduct(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ReviewResponse> response = reviewService.getReviewsByProduct(productId, page, size);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponse> updateReview(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @RequestBody @Valid ReviewRequest request) {
        ReviewResponse response = reviewService.updateReview(id, currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteReview(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id) {
        Map<String, Object> response = reviewService.deleteReview(id, currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/product/{productId}/can-review")
    public ResponseEntity<Map<String, Object>> canReview(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long productId) {
        if (currentUser == null) {
            Map<String, Object> result = new java.util.HashMap<>();
            result.put("canReview", false);
            result.put("hasPurchased", false);
            result.put("alreadyReviewed", false);
            return ResponseEntity.ok(result);
        }
        Map<String, Object> response = reviewService.canReview(currentUser.getUsername(), productId);
        return ResponseEntity.ok(response);
    }
}
