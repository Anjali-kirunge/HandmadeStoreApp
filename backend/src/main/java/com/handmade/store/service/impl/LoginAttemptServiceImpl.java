package com.handmade.store.service.impl;

import com.handmade.store.service.LoginAttemptService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptServiceImpl implements LoginAttemptService {

    private static final class Attempt {
        int count;
        LocalDateTime firstFailure;
    }

    private final Map<String, Attempt> attempts = new ConcurrentHashMap<>();

    @Value("${app.login.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.login.lock-minutes:15}")
    private long lockMinutes;

    @Override
    public boolean isBlocked(String email) {
        Attempt attempt = attempts.get(email.toLowerCase());
        if (attempt == null) {
            return false;
        }
        if (attempt.count >= maxAttempts) {
            if (Duration.between(attempt.firstFailure, LocalDateTime.now()).toMinutes() >= lockMinutes) {
                attempts.remove(email.toLowerCase());
                return false;
            }
            return true;
        }
        return false;
    }

    @Override
    public void recordFailure(String email) {
        String key = email.toLowerCase();
        attempts.compute(key, (k, attempt) -> {
            if (attempt == null) {
                Attempt fresh = new Attempt();
                fresh.count = 1;
                fresh.firstFailure = LocalDateTime.now();
                return fresh;
            }
            attempt.count++;
            return attempt;
        });
    }

    @Override
    public void reset(String email) {
        attempts.remove(email.toLowerCase());
    }
}
