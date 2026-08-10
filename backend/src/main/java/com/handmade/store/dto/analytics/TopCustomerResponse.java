package com.handmade.store.dto.analytics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TopCustomerResponse {
    private Long id;
    private String name;
    private String email;
    private Long totalOrders;
    private BigDecimal totalSpent;
    private LocalDateTime lastOrderAt;
}
