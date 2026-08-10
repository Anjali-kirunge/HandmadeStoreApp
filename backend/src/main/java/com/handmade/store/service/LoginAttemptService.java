package com.handmade.store.service;

public interface LoginAttemptService {

    boolean isBlocked(String email);

    void recordFailure(String email);

    void reset(String email);
}
