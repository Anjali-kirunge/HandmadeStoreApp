package com.handmade.store.controller;

import com.handmade.store.dto.coupon.ApplyCouponRequest;
import com.handmade.store.service.CouponService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/coupons")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyCoupon(@RequestBody @Valid ApplyCouponRequest request) {
        Map<String, Object> response = couponService.applyCoupon(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{code}/validate")
    public ResponseEntity<Map<String, Object>> validateCoupon(
            @PathVariable String code,
            @RequestParam BigDecimal orderTotal) {
        Map<String, Object> response = couponService.validateCoupon(code, orderTotal);
        return ResponseEntity.ok(response);
    }
}
