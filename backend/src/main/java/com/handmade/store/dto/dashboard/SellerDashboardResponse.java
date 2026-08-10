package com.handmade.store.dto.dashboard;

import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.product.ProductResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDashboardResponse {

    private Long totalProducts;
    private Long totalOrders;
    private BigDecimal totalRevenue;
    private Long pendingOrders;
    private List<OrderResponse> recentOrders;
    private List<Double> monthlyEarnings;
    private List<ProductResponse> topProducts;
}
