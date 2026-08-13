package com.handmade.store.controller;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.dashboard.SellerDashboardResponse;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.order.OrderStatusUpdateRequest;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.DashboardService;
import com.handmade.store.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/seller")
@PreAuthorize("hasAnyRole('SELLER', 'ADMIN')")
public class SellerController {

    private final DashboardService dashboardService;
    private final OrderService orderService;

    public SellerController(DashboardService dashboardService, OrderService orderService) {
        this.dashboardService = dashboardService;
        this.orderService = orderService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<SellerDashboardResponse> getSellerDashboard(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        SellerDashboardResponse response = dashboardService.getSellerDashboard(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<PageResponse<OrderResponse>> getOrdersBySeller(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> response = orderService.getOrdersBySeller(currentUser.getUsername(), page, size);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id,
            @RequestBody @Valid OrderStatusUpdateRequest request) {
        OrderResponse response = orderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(response);
    }
}
