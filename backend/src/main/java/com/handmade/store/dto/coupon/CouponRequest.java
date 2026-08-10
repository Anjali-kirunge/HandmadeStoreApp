package com.handmade.store.dto.coupon;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CouponRequest {

    @NotBlank(message = "Coupon code is required")
    private String code;

    @Positive(message = "Discount percentage must be positive")
    private Double discountPercentage;

    @Positive(message = "Max discount must be positive")
    private BigDecimal maxDiscount;

    @Positive(message = "Minimum purchase must be positive")
    private BigDecimal minPurchase;

    private Integer usageLimit;

    private LocalDateTime validFrom;

    private LocalDateTime validUntil;
}
