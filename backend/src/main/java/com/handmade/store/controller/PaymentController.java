package com.handmade.store.controller;

import com.handmade.store.dto.order.OrderRequest;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.payment.PaymentResponse;
import com.handmade.store.dto.payment.RazorpayCreateOrderResponse;
import com.handmade.store.dto.payment.RazorpayVerifyRequest;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.PaymentService;
import com.handmade.store.service.RazorpayPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/payments")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final PaymentService paymentService;
    private final RazorpayPaymentService razorpayPaymentService;

    public PaymentController(PaymentService paymentService,
                             RazorpayPaymentService razorpayPaymentService) {
        this.paymentService = paymentService;
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @PostMapping("/create-order")
    public ResponseEntity<RazorpayCreateOrderResponse> createRazorpayOrder(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid OrderRequest request) {
        RazorpayCreateOrderResponse response = razorpayPaymentService
                .createOrder(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<OrderResponse> verifyRazorpayPayment(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody @Valid RazorpayVerifyRequest request) {
        OrderResponse response = razorpayPaymentService
                .verifyAndCreateOrder(currentUser.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<Map<String, Object>> createCheckoutSession(
            @AuthenticationPrincipal CustomUserDetails currentUser,
            @RequestBody Map<String, Long> request) {
        Long orderId = request.get("orderId");
        Map<String, Object> response = paymentService.createStripeCheckoutSession(orderId, currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        Map<String, Object> response = paymentService.handleStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<PaymentResponse>> getPaymentsByUser(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        List<PaymentResponse> response = paymentService.getPaymentsByUser(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }
}
