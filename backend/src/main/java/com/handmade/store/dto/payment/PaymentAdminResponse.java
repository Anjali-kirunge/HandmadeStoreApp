package com.handmade.store.dto.payment;

import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.enums.PaymentMethod;
import com.handmade.store.enums.PaymentStatus;
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
public class PaymentAdminResponse {
    private Long id;
    private UserResponse user;
    private Long orderId;
    private BigDecimal amount;
    private String stripePaymentId;
    private String stripeSessionId;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private LocalDateTime createdAt;
}
