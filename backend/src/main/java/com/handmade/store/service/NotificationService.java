package com.handmade.store.service;

import com.handmade.store.dto.notification.NotificationResponse;

import java.util.List;
import java.util.Map;

public interface NotificationService {

    NotificationResponse createNotification(Long userId, String title, String message, String link);

    List<NotificationResponse> getNotifications(String email);

    NotificationResponse markAsRead(Long id);

    Map<String, Object> markAllAsRead(String email);

    long getUnreadCount(String email);
}
