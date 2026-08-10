package com.handmade.store.service.impl;

import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.payment.PaymentAdminResponse;
import com.handmade.store.dto.payment.PaymentResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Order;
import com.handmade.store.entity.Payment;
import com.handmade.store.entity.User;
import com.handmade.store.enums.OrderStatus;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.PaymentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    public PaymentServiceImpl(PaymentRepository paymentRepository,
                              OrderRepository orderRepository,
                              UserRepository userRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Map<String, Object> createStripeCheckoutSession(Long orderId, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("You do not have permission to pay for this order");
        }

        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseGet(() -> Payment.builder()
                        .order(order)
                        .user(user)
                        .amount(order.getTotalAmount())
                        .paymentMethod(order.getPaymentMethod())
                        .build());

        payment.setPaymentStatus(PaymentStatus.COMPLETED);
        paymentRepository.save(payment);

        order.setPaymentStatus(PaymentStatus.COMPLETED);
        order.setOrderStatus(OrderStatus.CONFIRMED);
        orderRepository.save(order);

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", "demo_session_" + order.getId());
        result.put("url", "/order-success?session_id=demo_" + order.getId());
        result.put("message", "Payment processed (demo mode)");
        return result;
    }

    @Override
    @Transactional
    public Map<String, Object> handleStripeWebhook(String payload, String sigHeader) {
        Map<String, Object> result = new HashMap<>();
        result.put("message", "Webhook handling skipped - demo mode");
        return result;
    }

    @Override
    public List<PaymentResponse> getPaymentsByUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return paymentRepository.findByUserId(user.getId()).stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PageResponse<PaymentAdminResponse> getAllPayments(int page, int size, PaymentStatus status) {
        Page<Payment> paymentPage;
        if (status != null) {
            paymentPage = paymentRepository.findByPaymentStatus(status,
                    PageRequest.of(page, size, Sort.by("createdAt").descending()));
        } else {
            paymentPage = paymentRepository.findAll(
                    PageRequest.of(page, size, Sort.by("createdAt").descending()));
        }

        return PageResponse.<PaymentAdminResponse>builder()
                .content(paymentPage.getContent().stream().map(this::mapToAdminResponse).toList())
                .pageNumber(paymentPage.getNumber())
                .pageSize(paymentPage.getSize())
                .totalElements(paymentPage.getTotalElements())
                .totalPages(paymentPage.getTotalPages())
                .last(paymentPage.isLast())
                .build();
    }

    private PaymentAdminResponse mapToAdminResponse(Payment payment) {
        User user = payment.getUser();
        UserResponse userResponse = null;
        if (user != null) {
            userResponse = UserResponse.builder()
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
        }

        return PaymentAdminResponse.builder()
                .id(payment.getId())
                .user(userResponse)
                .orderId(payment.getOrder() != null ? payment.getOrder().getId() : null)
                .amount(payment.getAmount())
                .stripePaymentId(payment.getStripePaymentId())
                .stripeSessionId(payment.getStripeSessionId())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .createdAt(payment.getCreatedAt())
                .build();
    }

    private PaymentResponse mapToPaymentResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .stripePaymentId(payment.getStripePaymentId())
                .paymentMethod(payment.getPaymentMethod())
                .paymentStatus(payment.getPaymentStatus())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
