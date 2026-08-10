package com.handmade.store.dto.payment;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RazorpayCreateOrderResponse {

    private String razorpayOrderId;

    private Integer amount;

    private BigDecimal amountInRupees;

    private String currency;

    private String keyId;
}
