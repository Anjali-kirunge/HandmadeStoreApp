package com.handmade.store.dto.review;

import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    private Long id;
    private UserResponse user;
    private ProductResponse product;
    private Integer rating;
    private String comment;
    private Set<String> images;
    private LocalDateTime createdAt;
}
