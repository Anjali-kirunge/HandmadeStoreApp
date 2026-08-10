package com.handmade.store.dto.wishlist;

import com.handmade.store.dto.product.ProductResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistResponse {

    private Long id;
    private List<ProductResponse> products;
}
