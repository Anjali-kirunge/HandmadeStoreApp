package com.handmade.store.service;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.payment.PaymentAdminResponse;
import com.handmade.store.dto.payment.PaymentResponse;
import com.handmade.store.enums.PaymentStatus;

import java.util.List;
import java.util.Map;

public interface PaymentService {

    Map<String, Object> createStripeCheckoutSession(Long orderId, String email);

    Map<String, Object> handleStripeWebhook(String payload, String sigHeader);

    List<PaymentResponse> getPaymentsByUser(String email);

    PageResponse<PaymentAdminResponse> getAllPayments(int page, int size, PaymentStatus status);
}
