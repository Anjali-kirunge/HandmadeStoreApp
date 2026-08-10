package com.handmade.store.service;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.product.ProductRequest;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.product.ProductSearchRequest;
import com.handmade.store.enums.ProductStatus;
import org.springframework.data.domain.Pageable;

public interface ProductService {

    ProductResponse createProduct(String sellerEmail, ProductRequest request);

    ProductResponse updateProduct(Long id, String sellerEmail, ProductRequest request);

    void deleteProduct(Long id, String sellerEmail);

    PageResponse<ProductResponse> getAllProducts(Pageable pageable);

    ProductResponse getProductById(Long id);

    PageResponse<ProductResponse> getProductsBySeller(String sellerEmail, Pageable pageable);

    PageResponse<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable);

    PageResponse<ProductResponse> searchProducts(ProductSearchRequest searchRequest, Pageable pageable);

    PageResponse<ProductResponse> getFeaturedProducts(Pageable pageable);

    ProductResponse updateStock(Long id, String sellerEmail, int quantity);

    ProductResponse toggleFeatured(Long id);

    ProductResponse createProductAsAdmin(String adminEmail, ProductRequest request);

    ProductResponse updateProductAsAdmin(Long id, ProductRequest request);

    void deleteProductAsAdmin(Long id);

    ProductResponse setStock(Long id, int quantity);

    ProductResponse updateStatus(Long id, ProductStatus status);

    PageResponse<ProductResponse> getInventory(String keyword, ProductStatus status, boolean lowStockOnly, Pageable pageable);
}
