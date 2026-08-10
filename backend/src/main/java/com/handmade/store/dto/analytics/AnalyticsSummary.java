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
public class AnalyticsSummary {
    private BigDecimal totalRevenue;
    private Long totalOrders;
    private Long totalCustomers;
    private Long totalSellers;
    private Long totalProducts;
    private BigDecimal todayRevenue;
    private Long todayOrders;
    private BigDecimal thisWeekRevenue;
    private Long thisWeekOrders;
    private BigDecimal thisMonthRevenue;
    private Long thisMonthOrders;
    private BigDecimal thisYearRevenue;
    private Long thisYearOrders;
    private BigDecimal averageOrderValue;
}
