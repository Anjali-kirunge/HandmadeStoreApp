package com.handmade.store.dto.order;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusUpdateRequest {

    @NotBlank(message = "Order status is required")
    private String orderStatus;

    private String trackingNumber;
}
