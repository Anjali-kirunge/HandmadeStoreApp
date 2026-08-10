package com.handmade.store.repository;

import com.handmade.store.entity.Product;
import com.handmade.store.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);
    Page<Product> findBySellerId(Long sellerId, Pageable pageable);
    List<Product> findBySellerId(Long sellerId);
    List<Product> findBySellerIdAndStatus(Long sellerId, ProductStatus status);
    Page<Product> findByStatus(ProductStatus status, Pageable pageable);
    List<Product> findByStatus(ProductStatus status);
    Page<Product> findByIsFeaturedTrue(Pageable pageable);
    List<Product> findByIsFeaturedTrue();

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:categoryId IS NULL OR p.category.id = :categoryId) AND " +
           "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
           "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
           "p.status = 'ACTIVE'")
    Page<Product> searchProducts(
            @Param("keyword") String keyword,
            @Param("categoryId") Long categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "(:keyword IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:lowStockOnly = false OR p.stockQuantity < :threshold)")
    Page<Product> findInventory(
            @Param("keyword") String keyword,
            @Param("status") ProductStatus status,
            @Param("lowStockOnly") boolean lowStockOnly,
            @Param("threshold") int threshold,
            Pageable pageable);
}
