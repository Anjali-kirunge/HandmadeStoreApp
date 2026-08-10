package com.handmade.store.dto.order;

import com.handmade.store.enums.PaymentMethod;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    private String shippingAddress;

    private PaymentMethod paymentMethod;

    private String couponCode;

    private String notes;
}
