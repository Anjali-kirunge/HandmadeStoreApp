package com.handmade.store.service.impl;

import com.handmade.store.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger logger = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    public EmailServiceImpl(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    @Async
    public void sendEmail(String to, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            logger.info("Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send email to {}: {}", to, e.getMessage());
            System.out.println("\n=======================================================");
            System.out.println("  EMAIL SENDING FAILED! FALLBACK TERMINAL OUTPUT");
            System.out.println("  To: " + to);
            System.out.println("  Subject: " + subject);
            System.out.println("=======================================================\n");
        }
    }

    @Override
    @Async
    public void sendOtpEmail(String to, String otp, String typeName, long expiryMinutes) {
        String subject = "Your " + typeName + " Verification Code";
        String body = buildOtpEmailHtml(otp, typeName, expiryMinutes);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            mailSender.send(message);
            logger.info("OTP Email sent successfully to: {}", to);
        } catch (Exception e) {
            logger.error("Failed to send OTP email to {}: {}", to, e.getMessage());
            System.out.println("\n=======================================================");
            System.out.println("  EMAIL SENDING FAILED! FALLBACK TERMINAL OUTPUT");
            System.out.println("  To: " + to);
            System.out.println("  Subject: " + subject);
            System.out.println("  ---> OTP CODE: " + otp + " <---");
            System.out.println("=======================================================\n");
        }
    }

    @Override
    @Async
    public void sendOrderConfirmation(String to, String orderId) {
        String subject = "Order Confirmation - Order #" + orderId;
        String body = buildOrderConfirmationHtml(orderId);
        sendEmail(to, subject, body);
    }

    @Override
    @Async
    public void sendPasswordReset(String to, String resetLink) {
        String subject = "Password Reset Request";
        String body = buildPasswordResetHtml(resetLink);
        sendEmail(to, subject, body);
    }

    private String buildOrderConfirmationHtml(String orderId) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background-color: #4F46E5; color: white; padding: 30px; text-align: center; }
                        .header h1 { margin: 0; font-size: 24px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .order-number { background-color: #F3F4F6; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; }
                        .order-number strong { font-size: 18px; color: #4F46E5; }
                        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
                        .btn { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Order Confirmed!</h1>
                        </div>
                        <div class="content">
                            <p>Thank you for your purchase!</p>
                            <div class="order-number">
                                <strong>Order #%s</strong>
                            </div>
                            <p>We have received your order and it is being processed. You will receive another email once your order has been shipped.</p>
                            <p>You can track your order status by logging into your account.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Handmade Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(orderId);
    }

    private String buildPasswordResetHtml(String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background-color: #DC2626; color: white; padding: 30px; text-align: center; }
                        .header h1 { margin: 0; font-size: 24px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; }
                        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
                        .btn { display: inline-block; background-color: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
                        .warning { background-color: #FEF2F2; border-left: 4px solid #DC2626; padding: 12px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset</h1>
                        </div>
                        <div class="content">
                            <p>We received a request to reset your password.</p>
                            <p>Click the button below to reset your password:</p>
                            <p style="text-align: center;">
                                <a href="%s" class="btn">Reset Password</a>
                            </p>
                            <div class="warning">
                                <p><strong>Important:</strong> This link will expire in 15 minutes. If you did not request a password reset, please ignore this email.</p>
                            </div>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Handmade Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(resetLink);
    }

    private String buildOtpEmailHtml(String otp, String typeName, long expiryMinutes) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
                        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background-color: #10B981; color: white; padding: 30px; text-align: center; }
                        .header h1 { margin: 0; font-size: 24px; }
                        .content { padding: 30px; color: #333333; line-height: 1.6; text-align: center; }
                        .otp-code { background-color: #F3F4F6; padding: 20px; border-radius: 6px; font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #10B981; margin: 20px 0; }
                        .footer { background-color: #F9FAFB; padding: 20px; text-align: center; color: #6B7280; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>%s Verification</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Your verification code is:</p>
                            <div class="otp-code">%s</div>
                            <p>This code will expire in %d minutes.</p>
                            <p>If you did not request this code, please ignore this email.</p>
                        </div>
                        <div class="footer">
                            <p>&copy; 2026 Handmade Store. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(typeName, otp, expiryMinutes);
    }
}
