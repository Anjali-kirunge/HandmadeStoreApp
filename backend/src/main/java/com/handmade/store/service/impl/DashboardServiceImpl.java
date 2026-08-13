package com.handmade.store.service.impl;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.dashboard.AdminDashboardResponse;
import com.handmade.store.dto.dashboard.SellerDashboardResponse;
import com.handmade.store.dto.order.OrderItemResponse;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.entity.Order;
import com.handmade.store.entity.OrderItem;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.Role;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.*;
import com.handmade.store.service.DashboardService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;

    public DashboardServiceImpl(UserRepository userRepository,
                                ProductRepository productRepository,
                                OrderRepository orderRepository,
                                OrderItemRepository orderItemRepository,
                                PaymentRepository paymentRepository) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
    }

    @Override
    public AdminDashboardResponse getAdminDashboard() {
        long totalUsers = userRepository.count();
        long totalSellers = userRepository.countByRole(Role.ROLE_SELLER);
        long totalProducts = productRepository.count();
        long totalOrders = orderRepository.count();

        BigDecimal totalRevenue = orderRepository.sumTotalAmountByOrderStatus(OrderStatus.DELIVERED);

        List<Order> recentOrders = orderRepository.findAll(
                PageRequest.of(0, 10, Sort.by("createdAt").descending()))
                .getContent();

        List<OrderResponse> recentOrderResponses = recentOrders.stream()
                .map(this::mapToOrderResponse)
                .toList();

        List<Double> monthlySales = calculateMonthlySales();

        Map<String, Long> orderStatusCounts = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            orderStatusCounts.put(status.name(), orderRepository.countByOrderStatus(status));
        }

        return AdminDashboardResponse.builder()
                .totalUsers(totalUsers)
                .totalSellers(totalSellers)
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .recentOrders(recentOrderResponses)
                .monthlySales(monthlySales)
                .orderStatusCounts(orderStatusCounts)
                .build();
    }

    @Override
    public SellerDashboardResponse getSellerDashboard(String sellerEmail) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        List<Product> sellerProducts = productRepository.findBySellerId(seller.getId());
        long totalProducts = sellerProducts.size();

        Set<Long> sellerProductIds = sellerProducts.stream()
                .map(Product::getId)
                .collect(Collectors.toSet());

        List<Order> sellerOrders = orderRepository.findAllBySellerId(seller.getId());

        long totalOrders = sellerOrders.size();

        BigDecimal totalRevenue = sellerOrders.stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.DELIVERED)
                .map(o -> {
                    BigDecimal orderTotal = o.getTotalAmount();
                    BigDecimal sellerShare = calculateSellerShare(o, sellerProductIds);
                    return sellerShare;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingOrders = sellerOrders.stream()
                .filter(o -> o.getOrderStatus() == OrderStatus.PENDING)
                .count();

        List<OrderResponse> recentOrders = sellerOrders.stream()
                .sorted(Comparator.comparing(Order::getCreatedAt).reversed())
                .limit(10)
                .map(this::mapToOrderResponse)
                .toList();

        List<Double> monthlyEarnings = calculateMonthlyEarnings(seller.getId());

        List<ProductResponse> topProducts = sellerProducts.stream()
                .sorted(Comparator.comparing(Product::getReviewCount).reversed())
                .limit(5)
                .map(this::mapToProductResponse)
                .toList();

        return SellerDashboardResponse.builder()
                .totalProducts(totalProducts)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue)
                .pendingOrders(pendingOrders)
                .recentOrders(recentOrders)
                .monthlyEarnings(monthlyEarnings)
                .topProducts(topProducts)
                .build();
    }

    private BigDecimal calculateSellerShare(Order order, Set<Long> sellerProductIds) {
        return order.getItems().stream()
                .filter(item -> sellerProductIds.contains(item.getProduct().getId()))
                .map(OrderItem::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private List<Double> calculateMonthlySales() {
        LocalDateTime from = YearMonth.now().minusMonths(11).atDay(1).atStartOfDay();
        Map<Integer, Double> totalsByMonth = new HashMap<>();
        for (Object[] row : orderRepository.sumTotalAmountByMonth(from)) {
            totalsByMonth.put(monthKey(((Number) row[0]).intValue(), ((Number) row[1]).intValue()),
                    ((BigDecimal) row[2]).doubleValue());
        }

        List<Double> monthlySales = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            monthlySales.add(totalsByMonth.getOrDefault(monthKey(month.getYear(), month.getMonthValue()), 0.0));
        }
        return monthlySales;
    }

    private List<Double> calculateMonthlyEarnings(Long sellerId) {
        LocalDateTime from = YearMonth.now().minusMonths(11).atDay(1).atStartOfDay();
        Map<Integer, Double> totalsByMonth = new HashMap<>();
        for (Object[] row : orderRepository.sumEarningsBySellerAndMonth(sellerId, from)) {
            totalsByMonth.put(monthKey(((Number) row[0]).intValue(), ((Number) row[1]).intValue()),
                    ((BigDecimal) row[2]).doubleValue());
        }

        List<Double> monthlyEarnings = new ArrayList<>();
        for (int i = 11; i >= 0; i--) {
            YearMonth month = YearMonth.now().minusMonths(i);
            monthlyEarnings.add(totalsByMonth.getOrDefault(monthKey(month.getYear(), month.getMonthValue()), 0.0));
        }
        return monthlyEarnings;
    }

    private int monthKey(int year, int month) {
        return year * 100 + month;
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .product(mapToProductResponse(item.getProduct()))
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .subtotal(item.getPrice())
                        .build())
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

    private ProductResponse mapToProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .images(product.getImages())
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .isFeatured(product.isFeatured())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
