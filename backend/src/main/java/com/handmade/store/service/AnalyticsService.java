package com.handmade.store.service;

import com.handmade.store.dto.analytics.AnalyticsResponse;

import java.time.LocalDate;

public interface AnalyticsService {
    AnalyticsResponse getAnalytics(LocalDate startDate, LocalDate endDate, int topN);
}
