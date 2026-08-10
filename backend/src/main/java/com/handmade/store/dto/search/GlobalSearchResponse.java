package com.handmade.store.dto.search;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.coupon.CouponResponse;
import com.handmade.store.dto.order.AdminOrderResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalSearchResponse {
    private List<ProductResponse> products;
    private List<UserResponse> users;
    private List<AdminOrderResponse> orders;
    private List<CategoryResponse> categories;
    private List<CouponResponse> coupons;
    private long totalResults;
}
