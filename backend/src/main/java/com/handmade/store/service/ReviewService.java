package com.handmade.store.service;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.review.ReviewRequest;
import com.handmade.store.dto.review.ReviewResponse;

import java.util.Map;

public interface ReviewService {

    ReviewResponse addReview(String email, Long productId, ReviewRequest request);

    PageResponse<ReviewResponse> getReviewsByProduct(Long productId, int page, int size);

    ReviewResponse updateReview(Long id, String email, ReviewRequest request);

    Map<String, Object> deleteReview(Long id, String email);

    Map<String, Object> deleteReviewAsAdmin(Long id);

    Map<String, Object> canReview(String email, Long productId);

    PageResponse<ReviewResponse> getAllReviews(int page, int size);
}
