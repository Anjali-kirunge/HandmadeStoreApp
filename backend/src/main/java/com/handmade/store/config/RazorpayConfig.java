package com.handmade.store.config;

import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

@Configuration
public class RazorpayConfig {

    @Value("${razorpay.key-id}")
    private String keyId;

    @Value("${razorpay.key-secret}")
    private String keySecret;

    @PostConstruct
    void validateRazorpayCredentials() {
        if (!StringUtils.hasText(keyId) || !keyId.startsWith("rzp_")) {
            throw new IllegalStateException(
                    "Razorpay is not configured: RAZORPAY_KEY_ID is missing or invalid. "
                            + "Create backend/.env (see backend/.env.example) with RAZORPAY_KEY_ID=rzp_test_... "
                            + "or set the RAZORPAY_KEY_ID environment variable, then restart the backend.");
        }
        if (!StringUtils.hasText(keySecret)) {
            throw new IllegalStateException(
                    "Razorpay is not configured: RAZORPAY_KEY_SECRET is missing. "
                            + "Create backend/.env (see backend/.env.example) with RAZORPAY_KEY_SECRET=<secret> "
                            + "or set the RAZORPAY_KEY_SECRET environment variable, then restart the backend.");
        }
    }

    @Bean
    public RazorpayClient razorpayClient() throws RazorpayException {
        return new RazorpayClient(keyId, keySecret);
    }
}
