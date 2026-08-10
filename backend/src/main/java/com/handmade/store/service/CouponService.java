package com.handmade.store.service;

import com.handmade.store.dto.coupon.ApplyCouponRequest;
import com.handmade.store.dto.coupon.CouponRequest;
import com.handmade.store.dto.coupon.CouponResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface CouponService {

    CouponResponse create(CouponRequest request);

    CouponResponse update(Long id, CouponRequest request);

    CouponResponse toggleActive(Long id);

    Map<String, Object> delete(Long id);

    CouponResponse getById(Long id);

    List<CouponResponse> getAll();

    Map<String, Object> applyCoupon(ApplyCouponRequest request);

    Map<String, Object> validateCoupon(String code, BigDecimal orderTotal);
}
