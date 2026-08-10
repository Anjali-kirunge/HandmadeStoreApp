package com.handmade.store.service;

import com.handmade.store.dto.product.ProductResponse;
import java.util.List;

public interface LowStockService {
    List<ProductResponse> getLowStockProducts(String sellerEmail);
    List<ProductResponse> getAllLowStockProducts();
    void checkAndNotifyLowStock();
}
