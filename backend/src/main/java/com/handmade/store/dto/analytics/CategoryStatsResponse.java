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
public class CategoryStatsResponse {
    private Long categoryId;
    private String name;
    private Long productCount;
    private Long totalOrders;
    private BigDecimal revenue;
}
