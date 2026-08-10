package com.handmade.store.service.impl;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.order.AdminOrderResponse;
import com.handmade.store.dto.order.OrderItemResponse;
import com.handmade.store.dto.order.OrderRequest;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.order.OrderStatusUpdateRequest;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.*;
import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentMethod;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.*;
import com.handmade.store.service.OrderService;
import com.handmade.store.service.NotificationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CouponRepository couponRepository;
    private final PaymentRepository paymentRepository;
    private final NotificationService notificationService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            OrderItemRepository orderItemRepository,
                            CartRepository cartRepository,
                            CartItemRepository cartItemRepository,
                            ProductRepository productRepository,
                            UserRepository userRepository,
                            CouponRepository couponRepository,
                            PaymentRepository paymentRepository,
                            NotificationService notificationService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.couponRepository = couponRepository;
        this.paymentRepository = paymentRepository;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public OrderResponse placeOrder(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            if (product.getStockQuantity() < cartItem.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getName());
            }
        }

        BigDecimal totalAmount = BigDecimal.ZERO;

        Order order = Order.builder()
                .user(user)
                .shippingAddress(request.getShippingAddress())
                .paymentMethod(request.getPaymentMethod() != null
                        ? request.getPaymentMethod() : PaymentMethod.COD)
                .notes(request.getNotes())
                .orderStatus(OrderStatus.PENDING)
                .paymentStatus(PaymentStatus.PENDING)
                .totalAmount(BigDecimal.ZERO)
                .build();
        order = orderRepository.save(order);

        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem cartItem : cart.getItems()) {
            Product product = cartItem.getProduct();
            BigDecimal itemPrice = product.getDiscountPrice() != null
                    ? product.getDiscountPrice() : product.getPrice();
            BigDecimal itemTotal = itemPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .order(order)
                    .product(product)
                    .quantity(cartItem.getQuantity())
                    .price(itemTotal)
                    .build();
            orderItems.add(orderItem);

            product.setStockQuantity(product.getStockQuantity() - cartItem.getQuantity());
            if (product.getStockQuantity() == 0) {
                product.setStatus(com.handmade.store.enums.ProductStatus.OUT_OF_STOCK);
            }
            productRepository.save(product);

            totalAmount = totalAmount.add(itemTotal);
        }
        orderItemRepository.saveAll(orderItems);
        order.setItems(orderItems);

        if (request.getCouponCode() != null && !request.getCouponCode().isEmpty()) {
            Coupon coupon = couponRepository.findByCode(request.getCouponCode())
                    .orElseThrow(() -> new BadRequestException("Invalid coupon code"));

            if (!coupon.isActive()) {
                throw new BadRequestException("Coupon is no longer active");
            }
            if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
                throw new BadRequestException("Coupon usage limit reached");
            }
            if (totalAmount.compareTo(coupon.getMinPurchase()) < 0) {
                throw new BadRequestException("Minimum purchase amount for this coupon is " + coupon.getMinPurchase());
            }

            BigDecimal discount = totalAmount.multiply(
                    coupon.getDiscountPercentage().divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP));
            if (discount.compareTo(coupon.getMaxDiscount()) > 0) {
                discount = coupon.getMaxDiscount();
            }
            totalAmount = totalAmount.subtract(discount);
            coupon.setUsedCount(coupon.getUsedCount() + 1);
            couponRepository.save(coupon);
        }

        order.setTotalAmount(totalAmount);
        orderRepository.save(order);

        Payment payment = Payment.builder()
                .order(order)
                .user(user)
                .amount(totalAmount)
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        cartItemRepository.deleteAll(cart.getItems());
        cart.getItems().clear();
        cartRepository.save(cart);

        return mapToOrderResponse(order);
    }

    @Override
    public PageResponse<OrderResponse> getOrders(String email, int page, int size) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Page<Order> orderPage = orderRepository.findByUserId(
                user.getId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return mapToPageResponse(orderPage);
    }

    @Override
    public OrderResponse getOrderById(Long id, String email) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not have permission to view this order");
        }

        return mapToOrderResponse(order);
    }

    @Override
    public PageResponse<OrderResponse> getAllOrders(int page, int size) {
        Page<Order> orderPage = orderRepository.findAll(
                PageRequest.of(page, size, Sort.by("createdAt").descending()));
        return mapToPageResponse(orderPage);
    }

    @Override
    @Transactional
    public OrderResponse updateOrderStatus(Long id, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        OrderStatus newStatus;
        try {
            newStatus = OrderStatus.valueOf(request.getOrderStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid order status: " + request.getOrderStatus());
        }

        order.setOrderStatus(newStatus);

        if (request.getTrackingNumber() != null) {
            order.setTrackingNumber(request.getTrackingNumber());
        }

        if (newStatus == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.COMPLETED);
        } else if (newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED) {
            order.setPaymentStatus(PaymentStatus.REFUNDED);
        }

        order = orderRepository.save(order);
        
        // Send notification to user
        String notificationTitle = "Order Update: #" + order.getId();
        String notificationMessage = "Your order status has been updated to " + newStatus.name().replace('_', ' ') + ".";
        notificationService.createNotification(
                order.getUser().getId(),
                notificationTitle,
                notificationMessage,
                "/orders/" + order.getId()
        );

        return mapToOrderResponse(order);
    }

    @Override
    public PageResponse<OrderResponse> getOrdersByStatus(OrderStatus status, int page, int size) {
        Page<Order> orderPage = orderRepository.findByOrderStatus(status,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.<OrderResponse>builder()
                .content(orderPage.getContent().stream().map(this::mapToOrderResponse).toList())
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    @Transactional
    public Map<String, Object> cancelOrder(Long id, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not have permission to cancel this order");
        }

        if (order.getOrderStatus() != OrderStatus.PENDING && order.getOrderStatus() != OrderStatus.CONFIRMED) {
            throw new BadRequestException("Order can only be cancelled when it is PENDING or CONFIRMED");
        }

        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.setStockQuantity(product.getStockQuantity() + item.getQuantity());
            if (product.getStatus() == com.handmade.store.enums.ProductStatus.OUT_OF_STOCK) {
                product.setStatus(com.handmade.store.enums.ProductStatus.ACTIVE);
            }
            productRepository.save(product);
        }

        order.setOrderStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.REFUNDED);
        orderRepository.save(order);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Order cancelled successfully");
        result.put("order", mapToOrderResponse(order));
        return result;
    }

    @Override
    public PageResponse<OrderResponse> getOrdersBySeller(String sellerEmail, int page, int size) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        Page<Order> orderPage = orderRepository.findBySellerId(seller.getId(),
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return mapToPageResponse(orderPage);
    }

    @Override
    public OrderResponse getOrderByIdForAdmin(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return mapToOrderResponse(order);
    }

    @Override
    public AdminOrderResponse getAdminOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", id));
        return mapToAdminOrderResponse(order);
    }

    @Override
    public PageResponse<AdminOrderResponse> getAllOrdersFiltered(String keyword, OrderStatus status, int page, int size) {
        Page<Order> orderPage = orderRepository.searchOrders(
                keyword == null || keyword.isBlank() ? null : keyword.trim(),
                status,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return PageResponse.<AdminOrderResponse>builder()
                .content(orderPage.getContent().stream().map(this::mapToAdminOrderResponse).toList())
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    @Override
    public PageResponse<OrderResponse> getOrdersByUserForAdmin(Long userId, int page, int size) {
        Page<Order> orderPage = orderRepository.findByUserId(
                userId,
                PageRequest.of(page, size, Sort.by("createdAt").descending()));

        return mapToPageResponse(orderPage);
    }

    private PageResponse<OrderResponse> mapToPageResponse(Page<Order> orderPage) {
        return PageResponse.<OrderResponse>builder()
                .content(orderPage.getContent().stream().map(this::mapToOrderResponse).toList())
                .pageNumber(orderPage.getNumber())
                .pageSize(orderPage.getSize())
                .totalElements(orderPage.getTotalElements())
                .totalPages(orderPage.getTotalPages())
                .last(orderPage.isLast())
                .build();
    }

    private AdminOrderResponse mapToAdminOrderResponse(Order order) {
        User user = order.getUser();
        UserResponse userResponse = UserResponse.builder()
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatar(user.getAvatar())
                .role(user.getRole())
                .enabled(user.isEnabled())
                .createdAt(user.getCreatedAt())
                .build();

        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::mapToOrderItemResponse)
                .toList();

        return AdminOrderResponse.builder()
                .id(order.getId())
                .user(userResponse)
                .items(items)
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(this::mapToOrderItemResponse)
                .toList();

        return OrderResponse.builder()
                .id(order.getId())
                .items(items)
                .totalAmount(order.getTotalAmount())
                .shippingAddress(order.getShippingAddress())
                .orderStatus(order.getOrderStatus())
                .paymentStatus(order.getPaymentStatus())
                .paymentMethod(order.getPaymentMethod())
                .trackingNumber(order.getTrackingNumber())
                .notes(order.getNotes())
                .createdAt(order.getCreatedAt())
                .build();
    }

    private OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        Product product = item.getProduct();

        CategoryResponse categoryResponse = null;
        if (product.getCategory() != null) {
            categoryResponse = CategoryResponse.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .description(product.getCategory().getDescription())
                    .imageUrl(product.getCategory().getImageUrl())
                    .createdAt(product.getCategory().getCreatedAt())
                    .build();
        }

        ProductResponse productResponse = ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .sku(product.getSku())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .images(product.getImages())
                .category(categoryResponse)
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .isFeatured(product.isFeatured())
                .createdAt(product.getCreatedAt())
                .build();

        return OrderItemResponse.builder()
                .id(item.getId())
                .product(productResponse)
                .quantity(item.getQuantity())
                .price(item.getPrice())
                .subtotal(item.getPrice())
                .build();
    }
}
