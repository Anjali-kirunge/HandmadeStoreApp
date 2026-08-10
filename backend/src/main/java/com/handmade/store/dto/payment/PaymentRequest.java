package com.handmade.store.dto.payment;

import com.handmade.store.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRequest {

    private Long orderId;

    private PaymentMethod paymentMethod;

    private String token;
}
