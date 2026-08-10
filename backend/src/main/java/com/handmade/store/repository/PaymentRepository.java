package com.handmade.store.repository;

import com.handmade.store.entity.Payment;
import com.handmade.store.enums.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserId(Long userId);

    Optional<Payment> findByOrderId(Long orderId);

    Optional<Payment> findByStripeSessionId(String stripeSessionId);

    Page<Payment> findByPaymentStatus(PaymentStatus paymentStatus, Pageable pageable);
}
