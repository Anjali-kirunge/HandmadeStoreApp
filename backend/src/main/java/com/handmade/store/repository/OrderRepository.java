package com.handmade.store.repository;

import com.handmade.store.entity.Order;
import com.handmade.store.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByUserId(Long userId, Pageable pageable);
    List<Order> findByUserId(Long userId);
    Page<Order> findByOrderStatus(OrderStatus orderStatus, Pageable pageable);
    Page<Order> findByUserIdAndOrderStatus(Long userId, OrderStatus orderStatus, Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.orderStatus = :status")
    long countByOrderStatus(@Param("status") OrderStatus status);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.orderStatus = :status")
    BigDecimal sumTotalAmountByOrderStatus(@Param("status") OrderStatus status);

    long countByUserId(Long userId);

    @Query("SELECT o FROM Order o WHERE " +
            "(:keyword IS NULL OR CAST(o.id AS string) LIKE CONCAT('%', :keyword, '%') OR " +
            "LOWER(o.user.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(CONCAT(o.user.firstName, ' ', o.user.lastName)) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
            "(:status IS NULL OR o.orderStatus = :status)")
    Page<Order> searchOrders(@Param("keyword") String keyword,
                             @Param("status") OrderStatus status,
                             Pageable pageable);

    @Query("SELECT o FROM Order o JOIN o.items oi JOIN oi.product p WHERE p.seller.id = :sellerId")
    Page<Order> findBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("SELECT DISTINCT o FROM Order o JOIN o.items oi JOIN oi.product p WHERE p.seller.id = :sellerId")
    List<Order> findAllBySellerId(@Param("sellerId") Long sellerId);

    @Query("SELECT COUNT(oi.id) FROM Order o JOIN o.items oi " +
            "WHERE o.user.id = :userId AND o.orderStatus = com.handmade.store.enums.OrderStatus.DELIVERED " +
            "AND oi.product.id = :productId")
    long countPurchasedAndDeliveredProduct(@Param("userId") Long userId, @Param("productId") Long productId);

    @Query("SELECT YEAR(o.createdAt), MONTH(o.createdAt), COALESCE(SUM(o.totalAmount), 0) " +
            "FROM Order o WHERE o.createdAt >= :from GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)")
    List<Object[]> sumTotalAmountByMonth(@Param("from") java.time.LocalDateTime from);

    @Query("SELECT YEAR(o.createdAt), MONTH(o.createdAt), COALESCE(SUM(oi.price), 0) " +
            "FROM Order o JOIN o.items oi JOIN oi.product p " +
            "WHERE p.seller.id = :sellerId AND o.orderStatus = com.handmade.store.enums.OrderStatus.DELIVERED " +
            "AND o.createdAt >= :from GROUP BY YEAR(o.createdAt), MONTH(o.createdAt)")
    List<Object[]> sumEarningsBySellerAndMonth(@Param("sellerId") Long sellerId, @Param("from") java.time.LocalDateTime from);
}
