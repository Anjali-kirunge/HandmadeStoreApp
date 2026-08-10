package com.handmade.store.service;

import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.enums.Role;

import java.time.LocalDate;

public interface ReportService {
    byte[] exportOrdersReport(String format, String keyword, OrderStatus status,
                              LocalDate from, LocalDate to);

    byte[] exportProductsReport(String format, String keyword, ProductStatus status,
                                boolean lowStockOnly);

    byte[] exportUsersReport(String format, String keyword, Role role);

    byte[] exportPaymentsReport(String format, PaymentStatus status,
                                LocalDate from, LocalDate to);

    byte[] exportAnalyticsReport(String format, LocalDate from, LocalDate to);
}
