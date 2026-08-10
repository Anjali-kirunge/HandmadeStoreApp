package com.handmade.store.service.impl;

import com.handmade.store.dto.analytics.AnalyticsResponse;
import com.handmade.store.dto.analytics.AnalyticsSummary;
import com.handmade.store.dto.analytics.CategoryStatsResponse;
import com.handmade.store.dto.analytics.RevenueTrendPoint;
import com.handmade.store.dto.analytics.TopCustomerResponse;
import com.handmade.store.dto.analytics.TopProductResponse;
import com.handmade.store.entity.Order;
import com.handmade.store.entity.OrderItem;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.enums.Role;
import com.handmade.store.repository.OrderItemRepository;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.AnalyticsService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final DateTimeFormatter DAY_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter YEAR_FORMAT = DateTimeFormatter.ofPattern("yyyy");

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;

    public AnalyticsServiceImpl(UserRepository userRepository,
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
    public AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate, int topN) {
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(365);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        if (endDate.isBefore(startDate)) {
            endDate = startDate;
        }
        if (topN <= 0) {
            topN = 5;
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay().minusNanos(1);

        List<Order> allOrders = orderRepository.findAll();

        List<Order> rangeOrders = allOrders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(start) && !o.getCreatedAt().isAfter(end))
                .toList();

        List<Order> revenueOrders = rangeOrders.stream()
                .filter(this::isRevenueOrder)
                .toList();

        BigDecimal totalRevenue = sumOrders(revenueOrders);
        long totalOrders = rangeOrders.size();

        long totalCustomers = userRepository.findByRole(Role.ROLE_CUSTOMER).size();
        long totalSellers = userRepository.findByRole(Role.ROLE_SELLER).size();
        long totalProducts = productRepository.count();

        AnalyticsSummary summary = AnalyticsSummary.builder()
                .totalRevenue(totalRevenue)
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalSellers(totalSellers)
                .totalProducts(totalProducts)
                .todayRevenue(computePeriodRevenue(allOrders, todayStart(), tomorrowStart()))
                .todayOrders(computePeriodOrders(allOrders, todayStart(), tomorrowStart()))
                .thisWeekRevenue(computePeriodRevenue(allOrders, weekStart(), tomorrowStart()))
                .thisWeekOrders(computePeriodOrders(allOrders, weekStart(), tomorrowStart()))
                .thisMonthRevenue(computePeriodRevenue(allOrders, monthStart(), tomorrowStart()))
                .thisMonthOrders(computePeriodOrders(allOrders, monthStart(), tomorrowStart()))
                .thisYearRevenue(computePeriodRevenue(allOrders, yearStart(), tomorrowStart()))
                .thisYearOrders(computePeriodOrders(allOrders, yearStart(), tomorrowStart()))
                .averageOrderValue(totalOrders > 0
                        ? totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO)
                .build();

        return AnalyticsResponse.builder()
                .summary(summary)
                .dailyRevenue(buildDailySeries(revenueOrders, start.toLocalDate(), end.toLocalDate()))
                .monthlyRevenue(buildMonthlySeries(revenueOrders, YearMonth.from(start), YearMonth.from(end)))
                .yearlyRevenue(buildYearlySeries(revenueOrders, start.getYear(), end.getYear()))
                .topProducts(buildTopProducts(rangeOrders, topN))
                .topCustomers(buildTopCustomers(rangeOrders, topN))
                .categoryBreakdown(buildCategoryBreakdown(allOrders))
                .orderStatusDistribution(buildOrderStatusDistribution(rangeOrders))
                .paymentStatusDistribution(buildPaymentStatusDistribution(rangeOrders))
                .build();
    }

    private boolean isRevenueOrder(Order order) {
        return order.getOrderStatus() != OrderStatus.CANCELLED
                && order.getOrderStatus() != OrderStatus.REFUNDED;
    }

    private BigDecimal sumOrders(List<Order> orders) {
        return orders.stream()
                .map(Order::getTotalAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long computePeriodOrders(List<Order> orders, LocalDateTime from, LocalDateTime to) {
        return orders.stream()
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(from) && o.getCreatedAt().isBefore(to))
                .count();
    }

    private BigDecimal computePeriodRevenue(List<Order> orders, LocalDateTime from, LocalDateTime to) {
        return orders.stream()
                .filter(this::isRevenueOrder)
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> !o.getCreatedAt().isBefore(from) && o.getCreatedAt().isBefore(to))
                .map(Order::getTotalAmount)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private LocalDateTime todayStart() {
        return LocalDate.now().atStartOfDay();
    }

    private LocalDateTime tomorrowStart() {
        return LocalDate.now().plusDays(1).atStartOfDay();
    }

    private LocalDateTime weekStart() {
        return LocalDate.now().minusDays(6).atStartOfDay();
    }

    private LocalDateTime monthStart() {
        return YearMonth.now().atDay(1).atStartOfDay();
    }

    private LocalDateTime yearStart() {
        return LocalDate.now().withDayOfYear(1).atStartOfDay();
    }

    private List<RevenueTrendPoint> buildDailySeries(List<Order> orders, LocalDate start, LocalDate end) {
        List<RevenueTrendPoint> points = new ArrayList<>();
        int maxDays = 366;
        long spanDays = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        if (spanDays > maxDays) {
            start = end.minusDays(maxDays);
        }

        LocalDate cursor = start;
        while (!cursor.isAfter(end)) {
            final LocalDateTime from = cursor.atStartOfDay();
            final LocalDateTime to = cursor.plusDays(1).atStartOfDay();

            List<Order> dayOrders = orders.stream()
                    .filter(o -> o.getCreatedAt() != null)
                    .filter(o -> !o.getCreatedAt().isBefore(from) && o.getCreatedAt().isBefore(to))
                    .toList();

            points.add(RevenueTrendPoint.builder()
                    .label(cursor.format(DAY_FORMAT))
                    .revenue(sumOrders(dayOrders))
                    .orders((long) dayOrders.size())
                    .build());
            cursor = cursor.plusDays(1);
        }
        return points;
    }

    private List<RevenueTrendPoint> buildMonthlySeries(List<Order> orders, YearMonth start, YearMonth end) {
        List<RevenueTrendPoint> points = new ArrayList<>();
        YearMonth cursor = start;
        int guard = 0;
        while (!cursor.isAfter(end) && guard < 120) {
            final LocalDateTime from = cursor.atDay(1).atStartOfDay();
            final LocalDateTime to = cursor.atEndOfMonth().plusDays(1).atStartOfDay();

            List<Order> monthOrders = orders.stream()
                    .filter(o -> o.getCreatedAt() != null)
                    .filter(o -> !o.getCreatedAt().isBefore(from) && o.getCreatedAt().isBefore(to))
                    .toList();

            points.add(RevenueTrendPoint.builder()
                    .label(cursor.format(MONTH_FORMAT))
                    .revenue(sumOrders(monthOrders))
                    .orders((long) monthOrders.size())
                    .build());
            cursor = cursor.plusMonths(1);
            guard++;
        }
        return points;
    }

    private List<RevenueTrendPoint> buildYearlySeries(List<Order> orders, int startYear, int endYear) {
        List<RevenueTrendPoint> points = new ArrayList<>();
        for (int year = startYear; year <= endYear; year++) {
            final int currentYear = year;
            List<Order> yearOrders = orders.stream()
                    .filter(o -> o.getCreatedAt() != null && o.getCreatedAt().getYear() == currentYear)
                    .toList();

            points.add(RevenueTrendPoint.builder()
                    .label(String.valueOf(year))
                    .revenue(sumOrders(yearOrders))
                    .orders((long) yearOrders.size())
                    .build());
        }
        return points;
    }

    private List<TopProductResponse> buildTopProducts(List<Order> orders, int topN) {
        Map<Long, Long> quantitySold = new HashMap<>();
        Map<Long, BigDecimal> productRevenue = new HashMap<>();

        for (Order order : orders) {
            if (!isRevenueOrder(order)) {
                continue;
            }
            for (OrderItem item : order.getItems()) {
                Product p = item.getProduct();
                if (p == null) {
                    continue;
                }
                quantitySold.merge(p.getId(), (long) item.getQuantity(), Long::sum);
                BigDecimal amount = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                productRevenue.merge(p.getId(), amount, BigDecimal::add);
            }
        }

        return quantitySold.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue().reversed())
                .limit(topN)
                .map(entry -> {
                    Product product = productRepository.findById(entry.getKey()).orElse(null);
                    if (product == null) {
                        return null;
                    }
                    return TopProductResponse.builder()
                            .id(product.getId())
                            .name(product.getName())
                            .imageUrl(product.getImageUrl())
                            .price(product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice())
                            .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                            .totalQuantitySold(entry.getValue())
                            .revenue(productRevenue.getOrDefault(product.getId(), BigDecimal.ZERO))
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<TopCustomerResponse> buildTopCustomers(List<Order> orders, int topN) {
        Map<Long, Long> orderCount = new HashMap<>();
        Map<Long, BigDecimal> customerSpend = new HashMap<>();
        Map<Long, LocalDateTime> lastOrder = new HashMap<>();

        for (Order order : orders) {
            if (order.getUser() == null) {
                continue;
            }
            Long userId = order.getUser().getId();
            orderCount.merge(userId, 1L, Long::sum);
            if (isRevenueOrder(order)) {
                customerSpend.merge(userId, order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO, BigDecimal::add);
            }
            if (order.getCreatedAt() != null) {
                lastOrder.merge(userId, order.getCreatedAt(), (a, b) -> a.isAfter(b) ? a : b);
            }
        }

        return customerSpend.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .limit(topN)
                .map(entry -> {
                    User user = userRepository.findById(entry.getKey()).orElse(null);
                    if (user == null) {
                        return null;
                    }
                    return TopCustomerResponse.builder()
                            .id(user.getId())
                            .name(user.getFirstName() + " " + user.getLastName())
                            .email(user.getEmail())
                            .totalOrders(orderCount.getOrDefault(user.getId(), 0L))
                            .totalSpent(entry.getValue())
                            .lastOrderAt(lastOrder.get(user.getId()))
                            .build();
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
    }

    private List<CategoryStatsResponse> buildCategoryBreakdown(List<Order> allOrders) {
        List<Product> products = productRepository.findAll();
        Map<Long, CategoryStatsResponse> categoryMap = new LinkedHashMap<>();

        for (Product product : products) {
            if (product.getCategory() == null) {
                continue;
            }
            Long categoryId = product.getCategory().getId();
            CategoryStatsResponse stats = categoryMap.computeIfAbsent(categoryId, id ->
                    CategoryStatsResponse.builder()
                            .categoryId(id)
                            .name(product.getCategory().getName())
                            .productCount(0L)
                            .totalOrders(0L)
                            .revenue(BigDecimal.ZERO)
                            .build());
            stats.setProductCount(stats.getProductCount() + 1);
        }

        for (Order order : allOrders) {
            if (!isRevenueOrder(order)) {
                continue;
            }
            Set<Long> orderCategories = order.getItems().stream()
                    .map(OrderItem::getProduct)
                    .filter(java.util.Objects::nonNull)
                    .filter(p -> p.getCategory() != null)
                    .map(p -> p.getCategory().getId())
                    .collect(Collectors.toSet());

            if (orderCategories.isEmpty()) {
                continue;
            }

            orderCategories.forEach(categoryId -> {
                CategoryStatsResponse stats = categoryMap.get(categoryId);
                if (stats != null) {
                    stats.setTotalOrders(stats.getTotalOrders() + 1);
                }
            });

            BigDecimal orderTotal = order.getTotalAmount() != null ? order.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal perCategory = orderTotal.divide(
                    BigDecimal.valueOf(orderCategories.size()), 2, RoundingMode.HALF_UP);

            orderCategories.forEach(categoryId -> {
                CategoryStatsResponse stats = categoryMap.get(categoryId);
                if (stats != null) {
                    stats.setRevenue(stats.getRevenue().add(perCategory));
                }
            });
        }

        return categoryMap.values().stream()
                .sorted(Comparator.comparing(CategoryStatsResponse::getRevenue).reversed())
                .collect(Collectors.toList());
    }

    private Map<String, Long> buildOrderStatusDistribution(List<Order> orders) {
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (OrderStatus status : OrderStatus.values()) {
            distribution.put(status.name(), 0L);
        }
        for (Order order : orders) {
            distribution.merge(order.getOrderStatus().name(), 1L, Long::sum);
        }
        return distribution;
    }

    private Map<String, Long> buildPaymentStatusDistribution(List<Order> orders) {
        Map<String, Long> distribution = new LinkedHashMap<>();
        for (PaymentStatus status : PaymentStatus.values()) {
            distribution.put(status.name(), 0L);
        }
        for (Order order : orders) {
            if (order.getPaymentStatus() != null) {
                distribution.merge(order.getPaymentStatus().name(), 1L, Long::sum);
            }
        }
        return distribution;
    }
}
