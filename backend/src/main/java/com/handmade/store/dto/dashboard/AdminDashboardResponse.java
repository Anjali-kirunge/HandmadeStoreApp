package com.handmade.store.dto.dashboard;

import com.handmade.store.dto.order.OrderResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {

    private Long totalUsers;
    private Long totalSellers;
    private Long totalProducts;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private List<OrderResponse> recentOrders;
    private List<Double> monthlySales;
    private Map<String, Long> orderStatusCounts;
}
