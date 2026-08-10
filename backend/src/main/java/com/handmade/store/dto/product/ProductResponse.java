package com.handmade.store.dto.product;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String sku;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stockQuantity;
    private String imageUrl;
    private Set<String> images;
    private CategoryResponse category;
    private UserResponse seller;
    private Double rating;
    private Integer reviewCount;
    private ProductStatus status;
    private Boolean isFeatured;
    private LocalDateTime createdAt;
}
