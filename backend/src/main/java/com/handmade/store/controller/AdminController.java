package com.handmade.store.controller;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.coupon.CouponRequest;
import com.handmade.store.dto.coupon.CouponResponse;
import com.handmade.store.dto.dashboard.AdminDashboardResponse;
import com.handmade.store.dto.notification.NotificationResponse;
import com.handmade.store.dto.order.AdminOrderResponse;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.order.OrderStatusUpdateRequest;
import com.handmade.store.dto.payment.PaymentAdminResponse;
import com.handmade.store.dto.product.ProductRequest;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.review.ReviewResponse;
import com.handmade.store.dto.search.GlobalSearchResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Order;
import com.handmade.store.entity.Payment;
import com.handmade.store.entity.RazorpayPayment;
import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.RazorpayPaymentRepository;
import com.handmade.store.service.AdminSearchService;
import com.handmade.store.service.CouponService;
import com.handmade.store.service.DashboardService;
import com.handmade.store.service.LowStockService;
import com.handmade.store.service.NotificationService;
import com.handmade.store.service.OrderService;
import com.handmade.store.service.PaymentService;
import com.handmade.store.service.ProductService;
import com.handmade.store.service.ReviewService;
import com.handmade.store.service.UserService;
import com.handmade.store.util.InvoiceGenerator;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final DashboardService dashboardService;
    private final OrderService orderService;
    private final CouponService couponService;
    private final ReviewService reviewService;
    private final NotificationService notificationService;
    private final UserService userService;
    private final ProductService productService;
    private final PaymentService paymentService;
    private final LowStockService lowStockService;
    private final AdminSearchService adminSearchService;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final RazorpayPaymentRepository razorpayPaymentRepository;
    private final InvoiceGenerator invoiceGenerator;

    public AdminController(DashboardService dashboardService,
                           OrderService orderService,
                           CouponService couponService,
                           ReviewService reviewService,
                           NotificationService notificationService,
                           UserService userService,
                           ProductService productService,
                           PaymentService paymentService,
                           LowStockService lowStockService,
                           AdminSearchService adminSearchService,
                           OrderRepository orderRepository,
                           PaymentRepository paymentRepository,
                           RazorpayPaymentRepository razorpayPaymentRepository,
                           InvoiceGenerator invoiceGenerator) {
        this.dashboardService = dashboardService;
        this.orderService = orderService;
        this.couponService = couponService;
        this.reviewService = reviewService;
        this.notificationService = notificationService;
        this.userService = userService;
        this.productService = productService;
        this.paymentService = paymentService;
        this.lowStockService = lowStockService;
        this.adminSearchService = adminSearchService;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.razorpayPaymentRepository = razorpayPaymentRepository;
        this.invoiceGenerator = invoiceGenerator;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard() {
        AdminDashboardResponse response = dashboardService.getAdminDashboard();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders")
    public ResponseEntity<PageResponse<AdminOrderResponse>> getAllOrders(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<AdminOrderResponse> response = orderService.getAllOrdersFiltered(keyword, status, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{id}")
    public ResponseEntity<AdminOrderResponse> getOrderById(@PathVariable Long id) {
        AdminOrderResponse response = orderService.getAdminOrderById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/{id}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new com.handmade.store.exception.ResourceNotFoundException("Order", "id", id));

        String transactionId = resolveTransactionId(id);
        byte[] invoiceBytes = invoiceGenerator.generateInvoicePdf(order, transactionId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "invoice-order-" + id + ".pdf");
        headers.setContentLength(invoiceBytes.length);

        return ResponseEntity.ok().headers(headers).body(invoiceBytes);
    }

    private String resolveTransactionId(Long orderId) {
        String stripeTxn = paymentRepository.findByOrderId(orderId)
                .map(Payment::getStripePaymentId)
                .filter(txn -> txn != null && !txn.isBlank())
                .orElse(null);
        if (stripeTxn != null) {
            return stripeTxn;
        }
        return razorpayPaymentRepository.findByOrderId(orderId)
                .map(RazorpayPayment::getRazorpayPaymentId)
                .orElse(null);
    }

    @PutMapping("/orders/{id}/status")
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody @Valid OrderStatusUpdateRequest request) {
        OrderResponse response = orderService.updateOrderStatus(id, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/status/{status}")
    public ResponseEntity<PageResponse<AdminOrderResponse>> getOrdersByStatus(
            @PathVariable OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<AdminOrderResponse> response = orderService.getAllOrdersFiltered(null, status, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> getUsers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<UserResponse> response = userService.searchUsers(keyword, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users/{id}/orders")
    public ResponseEntity<PageResponse<OrderResponse>> getUserOrders(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<OrderResponse> response = orderService.getOrdersByUserForAdmin(id, page, size);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        com.handmade.store.enums.Role role = com.handmade.store.enums.Role.valueOf(request.get("role"));
        UserResponse response = userService.updateUserRole(id, role);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @RequestBody com.handmade.store.dto.user.UserUpdateRequest request) {
        UserResponse response = userService.updateUserAsAdmin(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<UserResponse> toggleUserEnabled(@PathVariable Long id) {
        UserResponse response = userService.toggleUserEnabled(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = userService.deleteUser(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/products")
    public ResponseEntity<PageResponse<ProductResponse>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) ProductStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ProductResponse> response = productService.getInventory(
                keyword, status, false, PageRequest.of(page, size));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/products")
    public ResponseEntity<ProductResponse> createProduct(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody @Valid ProductRequest request) {
        ProductResponse response = productService.createProductAsAdmin(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<ProductResponse> updateProduct(
            @PathVariable Long id,
            @RequestBody @Valid ProductRequest request) {
        ProductResponse response = productService.updateProductAsAdmin(id, request);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<Map<String, Object>> deleteProduct(@PathVariable Long id) {
        productService.deleteProductAsAdmin(id);
        return ResponseEntity.ok(Map.of("message", "Product deleted successfully"));
    }

    @PutMapping("/products/{id}/stock")
    public ResponseEntity<ProductResponse> setStock(
            @PathVariable Long id,
            @RequestBody Map<String, Integer> request) {
        ProductResponse response = productService.setStock(id, request.get("quantity"));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/products/{id}/status")
    public ResponseEntity<ProductResponse> setStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        String value = request.get("status");
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Status is required");
        }
        ProductStatus status;
        try {
            status = ProductStatus.valueOf(value);
        } catch (IllegalArgumentException ex) {
            throw new BadRequestException("Invalid status: " + value);
        }
        ProductResponse response = productService.updateStatus(id, status);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/products/{id}/featured")
    public ResponseEntity<ProductResponse> toggleFeatured(@PathVariable Long id) {
        ProductResponse response = productService.toggleFeatured(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/inventory/low-stock")
    public ResponseEntity<List<ProductResponse>> getLowStockProducts() {
        List<ProductResponse> response = lowStockService.getAllLowStockProducts();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/payments")
    public ResponseEntity<PageResponse<PaymentAdminResponse>> getPayments(
            @RequestParam(required = false) PaymentStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<PaymentAdminResponse> response = paymentService.getAllPayments(page, size, status);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    public ResponseEntity<GlobalSearchResponse> globalSearch(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {
        GlobalSearchResponse response = adminSearchService.globalSearch(q, limit);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/coupons")
    public ResponseEntity<List<CouponResponse>> getAllCoupons() {
        List<CouponResponse> response = couponService.getAll();
        return ResponseEntity.ok(response);
    }

    @PostMapping("/coupons")
    public ResponseEntity<CouponResponse> createCoupon(@RequestBody @Valid CouponRequest request) {
        CouponResponse response = couponService.create(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/coupons/{id}")
    public ResponseEntity<CouponResponse> updateCoupon(
            @PathVariable Long id,
            @RequestBody @Valid CouponRequest request) {
        CouponResponse response = couponService.update(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/coupons/{id}/toggle")
    public ResponseEntity<CouponResponse> toggleCoupon(@PathVariable Long id) {
        CouponResponse response = couponService.toggleActive(id);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Map<String, Object>> deleteCoupon(@PathVariable Long id) {
        Map<String, Object> response = couponService.delete(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/reviews")
    public ResponseEntity<PageResponse<ReviewResponse>> getAllReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PageResponse<ReviewResponse> response = reviewService.getAllReviews(page, size);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/reviews/{id}")
    public ResponseEntity<Map<String, Object>> deleteReview(@PathVariable Long id) {
        Map<String, Object> response = reviewService.deleteReviewAsAdmin(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestParam String email) {
        List<NotificationResponse> response = notificationService.getNotifications(email);
        return ResponseEntity.ok(response);
    }
}
