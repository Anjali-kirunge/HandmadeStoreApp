package com.handmade.store.service;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.order.AdminOrderResponse;
import com.handmade.store.dto.order.OrderRequest;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.order.OrderStatusUpdateRequest;
import com.handmade.store.enums.OrderStatus;

import java.util.Map;

public interface OrderService {

    OrderResponse placeOrder(String email, OrderRequest request);

    PageResponse<OrderResponse> getOrders(String email, int page, int size);

    OrderResponse getOrderById(Long id, String email);

    PageResponse<OrderResponse> getAllOrders(int page, int size);

    OrderResponse updateOrderStatus(Long id, OrderStatusUpdateRequest request);

    PageResponse<OrderResponse> getOrdersByStatus(OrderStatus status, int page, int size);

    Map<String, Object> cancelOrder(Long id, String email);

    PageResponse<OrderResponse> getOrdersBySeller(String sellerEmail, int page, int size);

    OrderResponse getOrderByIdForAdmin(Long id);

    AdminOrderResponse getAdminOrderById(Long id);

    PageResponse<AdminOrderResponse> getAllOrdersFiltered(String keyword, OrderStatus status, int page, int size);

    PageResponse<OrderResponse> getOrdersByUserForAdmin(Long userId, int page, int size);
}
