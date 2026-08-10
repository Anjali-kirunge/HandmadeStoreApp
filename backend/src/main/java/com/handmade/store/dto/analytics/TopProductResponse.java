package com.handmade.store.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopProductResponse {
    private Long id;
    private String name;
    private String imageUrl;
    private BigDecimal price;
    private String categoryName;
    private Long totalQuantitySold;
    private BigDecimal revenue;
}
