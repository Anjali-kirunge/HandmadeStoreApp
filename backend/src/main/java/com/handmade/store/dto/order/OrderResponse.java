package com.handmade.store.dto.order;

import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentMethod;
import com.handmade.store.enums.PaymentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private List<OrderItemResponse> items;
    private BigDecimal totalAmount;
    private String shippingAddress;
    private OrderStatus orderStatus;
    private PaymentStatus paymentStatus;
    private PaymentMethod paymentMethod;
    private String trackingNumber;
    private String notes;
    private LocalDateTime createdAt;
}
