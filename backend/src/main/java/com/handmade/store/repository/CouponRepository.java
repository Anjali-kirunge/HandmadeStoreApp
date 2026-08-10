package com.handmade.store.repository;

import com.handmade.store.entity.Coupon;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {

    Optional<Coupon> findByCode(String code);

    boolean existsByCode(String code);

    List<Coupon> findByActiveTrue();

    @Query("SELECT c FROM Coupon c WHERE LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Coupon> searchCoupons(@Param("keyword") String keyword, Pageable pageable);
}
