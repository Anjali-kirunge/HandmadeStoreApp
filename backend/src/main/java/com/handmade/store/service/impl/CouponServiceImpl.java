package com.handmade.store.service.impl;

import com.handmade.store.dto.coupon.ApplyCouponRequest;
import com.handmade.store.dto.coupon.CouponRequest;
import com.handmade.store.dto.coupon.CouponResponse;
import com.handmade.store.entity.Coupon;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.CouponRepository;
import com.handmade.store.service.CouponService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CouponServiceImpl implements CouponService {

    private final CouponRepository couponRepository;

    public CouponServiceImpl(CouponRepository couponRepository) {
        this.couponRepository = couponRepository;
    }

    @Override
    @Transactional
    public CouponResponse create(CouponRequest request) {
        if (couponRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Coupon code already exists");
        }

        Coupon coupon = Coupon.builder()
                .code(request.getCode().toUpperCase())
                .discountPercentage(BigDecimal.valueOf(request.getDiscountPercentage()))
                .maxDiscount(request.getMaxDiscount())
                .minPurchase(request.getMinPurchase())
                .usageLimit(request.getUsageLimit() != null ? request.getUsageLimit() : 100)
                .validFrom(request.getValidFrom() != null ? request.getValidFrom() : LocalDateTime.now())
                .validUntil(request.getValidUntil())
                .active(true)
                .build();

        coupon = couponRepository.save(coupon);
        return mapToCouponResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));

        if (request.getCode() != null) {
            coupon.setCode(request.getCode().toUpperCase());
        }
        if (request.getDiscountPercentage() != null) {
            coupon.setDiscountPercentage(BigDecimal.valueOf(request.getDiscountPercentage()));
        }
        if (request.getMaxDiscount() != null) {
            coupon.setMaxDiscount(request.getMaxDiscount());
        }
        if (request.getMinPurchase() != null) {
            coupon.setMinPurchase(request.getMinPurchase());
        }
        if (request.getUsageLimit() != null) {
            coupon.setUsageLimit(request.getUsageLimit());
        }
        if (request.getValidFrom() != null) {
            coupon.setValidFrom(request.getValidFrom());
        }
        if (request.getValidUntil() != null) {
            coupon.setValidUntil(request.getValidUntil());
        }

        coupon = couponRepository.save(coupon);
        return mapToCouponResponse(coupon);
    }

    @Override
    @Transactional
    public CouponResponse toggleActive(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        coupon.setActive(!coupon.isActive());
        coupon = couponRepository.save(coupon);
        return mapToCouponResponse(coupon);
    }

    @Override
    @Transactional
    public Map<String, Object> delete(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        couponRepository.delete(coupon);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Coupon deleted successfully");
        return result;
    }

    @Override
    public CouponResponse getById(Long id) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Coupon", "id", id));
        return mapToCouponResponse(coupon);
    }

    @Override
    public List<CouponResponse> getAll() {
        return couponRepository.findAll().stream()
                .map(this::mapToCouponResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Map<String, Object> applyCoupon(ApplyCouponRequest request) {
        Coupon coupon = couponRepository.findByCode(request.getCode().toUpperCase())
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));

        validateCouponInternal(coupon, request.getOrderTotal());

        BigDecimal discount = request.getOrderTotal().multiply(
                coupon.getDiscountPercentage().divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP));

        if (discount.compareTo(coupon.getMaxDiscount()) > 0) {
            discount = coupon.getMaxDiscount();
        }

        BigDecimal finalTotal = request.getOrderTotal().subtract(discount);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Coupon applied successfully");
        result.put("discount", discount);
        result.put("finalTotal", finalTotal);
        result.put("couponCode", coupon.getCode());
        return result;
    }

    @Override
    public Map<String, Object> validateCoupon(String code, BigDecimal orderTotal) {
        Coupon coupon = couponRepository.findByCode(code.toUpperCase())
                .orElseThrow(() -> new BadRequestException("Invalid coupon code"));

        validateCouponInternal(coupon, orderTotal);

        BigDecimal discount = orderTotal.multiply(
                coupon.getDiscountPercentage().divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP));

        if (discount.compareTo(coupon.getMaxDiscount()) > 0) {
            discount = coupon.getMaxDiscount();
        }

        Map<String, Object> result = new HashMap<>();
        result.put("valid", true);
        result.put("discountPercentage", coupon.getDiscountPercentage());
        result.put("maxDiscount", coupon.getMaxDiscount());
        result.put("discount", discount);
        result.put("finalTotal", orderTotal.subtract(discount));
        return result;
    }

    private void validateCouponInternal(Coupon coupon, BigDecimal orderTotal) {
        if (!coupon.isActive()) {
            throw new BadRequestException("Coupon is no longer active");
        }
        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new BadRequestException("Coupon usage limit reached");
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(coupon.getValidFrom())) {
            throw new BadRequestException("Coupon is not yet valid");
        }
        if (coupon.getValidUntil() != null && now.isAfter(coupon.getValidUntil())) {
            throw new BadRequestException("Coupon has expired");
        }
        if (orderTotal.compareTo(coupon.getMinPurchase()) < 0) {
            throw new BadRequestException("Minimum purchase amount for this coupon is " + coupon.getMinPurchase());
        }
    }

    private CouponResponse mapToCouponResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .discountPercentage(coupon.getDiscountPercentage().doubleValue())
                .maxDiscount(coupon.getMaxDiscount())
                .minPurchase(coupon.getMinPurchase())
                .usageLimit(coupon.getUsageLimit())
                .usedCount(coupon.getUsedCount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .active(coupon.isActive())
                .build();
    }
}
