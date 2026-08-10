package com.handmade.store.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private AnalyticsSummary summary;
    private List<RevenueTrendPoint> dailyRevenue;
    private List<RevenueTrendPoint> monthlyRevenue;
    private List<RevenueTrendPoint> yearlyRevenue;
    private List<TopProductResponse> topProducts;
    private List<TopCustomerResponse> topCustomers;
    private List<CategoryStatsResponse> categoryBreakdown;
    private Map<String, Long> orderStatusDistribution;
    private Map<String, Long> paymentStatusDistribution;
}
