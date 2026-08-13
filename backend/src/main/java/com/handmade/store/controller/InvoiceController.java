package com.handmade.store.controller;

import com.handmade.store.entity.Order;
import com.handmade.store.entity.Payment;
import com.handmade.store.entity.RazorpayPayment;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.OrderRepository;
import com.handmade.store.repository.PaymentRepository;
import com.handmade.store.repository.RazorpayPaymentRepository;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.OrderService;
import com.handmade.store.util.InvoiceGenerator;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final OrderService orderService;
    private final InvoiceGenerator invoiceGenerator;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final RazorpayPaymentRepository razorpayPaymentRepository;

    public InvoiceController(OrderService orderService,
                             InvoiceGenerator invoiceGenerator,
                             OrderRepository orderRepository,
                             PaymentRepository paymentRepository,
                             RazorpayPaymentRepository razorpayPaymentRepository) {
        this.orderService = orderService;
        this.invoiceGenerator = invoiceGenerator;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.razorpayPaymentRepository = razorpayPaymentRepository;
    }

    @GetMapping("/order/{orderId}/download")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable Long orderId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {

        orderService.getOrderById(orderId, currentUser.getUsername());

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));

        String transactionId = resolveTransactionId(orderId);
        byte[] invoiceBytes = invoiceGenerator.generateInvoicePdf(order, transactionId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment",
                "invoice-order-" + orderId + ".pdf");
        headers.setContentLength(invoiceBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(invoiceBytes);
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
}
