package com.handmade.store.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApplyCouponRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    private BigDecimal orderTotal;
}
