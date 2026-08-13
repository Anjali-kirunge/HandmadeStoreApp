package com.handmade.store.controller;

import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.LowStockService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class LowStockController {

    private final LowStockService lowStockService;

    public LowStockController(LowStockService lowStockService) {
        this.lowStockService = lowStockService;
    }

    @GetMapping("/low-stock")
    @PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
    public ResponseEntity<List<ProductResponse>> getLowStockProducts(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(lowStockService.getLowStockProducts(currentUser.getUsername()));
    }

    @PostMapping("/check")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> triggerLowStockCheck() {
        lowStockService.checkAndNotifyLowStock();
        return ResponseEntity.ok("Low stock check completed");
    }
}
