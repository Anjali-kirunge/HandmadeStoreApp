package com.handmade.store.controller;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.order.OrderRequest;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/orders")
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<OrderResponse> placeOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid OrderRequest request) {
        OrderResponse response = orderService.placeOrder(currentUser.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<PageResponse<OrderResponse>> getOrders(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> response = orderService.getOrders(currentUser.getUsername(), page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id) {
        OrderResponse response = orderService.getOrderById(id, currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @PathVariable Long id) {
        Map<String, Object> response = orderService.cancelOrder(id, currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/seller")
    public ResponseEntity<PageResponse<OrderResponse>> getSellerOrders(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> response = orderService.getOrdersBySeller(currentUser.getUsername(), page, size);
        return ResponseEntity.ok(response);
    }
}
