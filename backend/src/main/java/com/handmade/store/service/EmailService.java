package com.handmade.store.service;

public interface EmailService {

    void sendEmail(String to, String subject, String body);

    void sendOrderConfirmation(String to, String orderId);

    void sendPasswordReset(String to, String resetLink);

    void sendOtpEmail(String to, String otp, String typeName, long expiryMinutes);
}
