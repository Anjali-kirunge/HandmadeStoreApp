package com.handmade.store.service;

import com.handmade.store.dto.order.OrderRequest;
import com.handmade.store.dto.order.OrderResponse;
import com.handmade.store.dto.payment.RazorpayCreateOrderResponse;
import com.handmade.store.dto.payment.RazorpayVerifyRequest;

public interface RazorpayPaymentService {

    RazorpayCreateOrderResponse createOrder(String email, OrderRequest request);

    OrderResponse verifyAndCreateOrder(String email, RazorpayVerifyRequest request);
}
