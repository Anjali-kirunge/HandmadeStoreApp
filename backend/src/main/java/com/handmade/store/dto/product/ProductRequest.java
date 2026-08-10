package com.handmade.store.dto.product;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    private String name;

    private String description;

    @Positive(message = "Price must be a positive value")
    private BigDecimal price;

    private BigDecimal discountPrice;

    private String sku;

    @PositiveOrZero(message = "Stock quantity cannot be negative")
    private Integer stockQuantity;

    private String imageUrl;

    private Set<String> images;

    private Long categoryId;

    private Boolean isFeatured;
}
