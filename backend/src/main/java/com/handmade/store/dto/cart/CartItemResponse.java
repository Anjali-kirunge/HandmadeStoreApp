package com.handmade.store.dto.cart;

import com.handmade.store.dto.product.ProductResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CartItemResponse {

    private Long id;
    private ProductResponse product;
    private Integer quantity;
    private BigDecimal price;
    private BigDecimal subtotal;
}
