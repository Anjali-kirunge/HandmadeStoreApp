package com.handmade.store.service.impl;

import com.handmade.store.dto.order.OrderRequest;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.payment.RazorpayCreateOrderResponse;
import com.handmade.store.dto.payment.RazorpayVerifyRequest;
import com.handmade.store.entity.Cart;
import com.handmade.store.entity.CartItem;
import com.handmade.store.entity.Order;
import com.handmade.store.entity.Payment;
import com.handmade.store.entity.RazorpayPayment;
import com.handmade.store.entity.User;
import com.handmade.store.enums.PaymentMethod;
import com.handmade.store.enums.PaymentStatus;
import com.handmade.store.enums.RazorpayPaymentStatus;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.CartRepository;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.RazorpayPaymentRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.CouponService;
import com.handmade.store.service.OrderService;
import com.handmade.store.service.RazorpayPaymentService;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.UUID;

@Service
public class RazorpayPaymentServiceImpl implements RazorpayPaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayPaymentRepository razorpayPaymentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PaymentRepository paymentRepository;
    private final OrderService orderService;
    private final CouponService couponService;
    private final PlatformTransactionManager transactionManager;

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    public RazorpayPaymentServiceImpl(RazorpayClient razorpayClient,
                                      RazorpayPaymentRepository razorpayPaymentRepository,
                                      OrderRepository orderRepository,
                                      UserRepository userRepository,
                                      CartRepository cartRepository,
                                      PaymentRepository paymentRepository,
                                      OrderService orderService,
                                      CouponService couponService,
                                      PlatformTransactionManager transactionManager) {
        this.razorpayClient = razorpayClient;
        this.razorpayPaymentRepository = razorpayPaymentRepository;
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.paymentRepository = paymentRepository;
        this.orderService = orderService;
        this.couponService = couponService;
        this.transactionManager = transactionManager;
    }

    @Override
    @Transactional
    public RazorpayCreateOrderResponse createOrder(String email, OrderRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (request.getShippingAddress() == null || request.getShippingAddress().isBlank()) {
            throw new BadRequestException("Shipping address is required");
        }

        Cart cart = cartRepository.findByUserId(user.getId())
                .orElseThrow(() -> new BadRequestException("Cart is empty"));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Cart is empty");
        }

        BigDecimal subtotal = BigDecimal.ZERO;
        for (CartItem cartItem : cart.getItems()) {
            BigDecimal itemPrice = cartItem.getProduct().getDiscountPrice() != null
                    ? cartItem.getProduct().getDiscountPrice() : cartItem.getProduct().getPrice();
            subtotal = subtotal.add(itemPrice.multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        BigDecimal finalTotal = subtotal;
        if (request.getCouponCode() != null && !request.getCouponCode().isBlank()) {
            Map<String, Object> couponResult = couponService.validateCoupon(request.getCouponCode(), subtotal);
            finalTotal = (BigDecimal) couponResult.get("finalTotal");
        }

        if (finalTotal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Order total must be greater than zero");
        }

        int amountPaise = finalTotal.multiply(BigDecimal.valueOf(100))
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
        String currency = "INR";

        try {
            JSONObject options = new JSONObject();
            options.put("amount", amountPaise);
            options.put("currency", currency);
            options.put("receipt", "rzr_" + UUID.randomUUID().toString().replace("-", ""));
            com.razorpay.Order razorpayOrder = razorpayClient.orders.create(options);

            RazorpayPayment payment = RazorpayPayment.builder()
                    .user(user)
                    .razorpayOrderId(razorpayOrder.get("id").toString())
                    .amount(finalTotal)
                    .currency(currency)
                    .status(RazorpayPaymentStatus.PENDING)
                    .build();
            razorpayPaymentRepository.save(payment);

            return RazorpayCreateOrderResponse.builder()
                    .razorpayOrderId(payment.getRazorpayOrderId())
                    .amount(amountPaise)
                    .amountInRupees(finalTotal)
                    .currency(currency)
                    .keyId(keyId)
                    .build();
        } catch (RazorpayException e) {
            throw new BadRequestException("Failed to create Razorpay order: " + e.getMessage());
        } catch (Exception e) {
            throw new BadRequestException("Failed to create Razorpay order");
        }
    }

    @Override
    @Transactional
    public OrderResponse verifyAndCreateOrder(String email, RazorpayVerifyRequest request) {
        if (request.getOrderRequest() == null) {
            throw new BadRequestException("Order details are required");
        }

        RazorpayPayment payment = razorpayPaymentRepository
                .findByRazorpayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new BadRequestException("Invalid Razorpay order id"));

        if (!payment.getUser().getEmail().equalsIgnoreCase(email)) {
            throw new BadRequestException("This payment order does not belong to the current user");
        }

        if (payment.getStatus() == RazorpayPaymentStatus.COMPLETED && payment.getOrder() != null) {
            return orderService.getOrderById(payment.getOrder().getId(), email);
        }

        RazorpayPayment existingByPaymentId = razorpayPaymentRepository
                .findByRazorpayPaymentId(request.getRazorpayPaymentId())
                .orElse(null);
        if (existingByPaymentId != null && !existingByPaymentId.getId().equals(payment.getId())
                && existingByPaymentId.getOrder() != null) {
            return orderService.getOrderById(existingByPaymentId.getOrder().getId(), email);
        }

        if (!verifySignature(request.getRazorpayOrderId(), request.getRazorpayPaymentId(),
                request.getRazorpaySignature())) {
            markPaymentFailed(payment.getId());
            throw new BadRequestException("Payment verification failed. Invalid signature.");
        }

        OrderRequest orderRequest = request.getOrderRequest();
        orderRequest.setPaymentMethod(PaymentMethod.RAZORPAY);

        OrderResponse orderResponse = orderService.placeOrder(email, orderRequest);

        Order order = orderRepository.findById(orderResponse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderResponse.getId()));

        order.setPaymentStatus(PaymentStatus.COMPLETED);
        orderRepository.save(order);

        paymentRepository.findByOrderId(order.getId()).ifPresent(p -> {
            p.setPaymentStatus(PaymentStatus.COMPLETED);
            paymentRepository.save(p);
        });

        payment.setStatus(RazorpayPaymentStatus.COMPLETED);
        payment.setRazorpayPaymentId(request.getRazorpayPaymentId());
        payment.setRazorpaySignature(request.getRazorpaySignature());
        payment.setOrder(order);
        razorpayPaymentRepository.save(payment);

        return orderService.getOrderById(order.getId(), email);
    }

    private void markPaymentFailed(Long paymentId) {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        txTemplate.execute(status -> {
            razorpayPaymentRepository.findById(paymentId).ifPresent(p -> {
                p.setStatus(RazorpayPaymentStatus.FAILED);
                razorpayPaymentRepository.save(p);
            });
            return null;
        });
    }

    private boolean verifySignature(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {
        try {
            String payload = razorpayOrderId + "|" + razorpayPaymentId;
            return Utils.verifySignature(payload, razorpaySignature, keySecret);
        } catch (Exception e) {
            return false;
        }
    }
}
