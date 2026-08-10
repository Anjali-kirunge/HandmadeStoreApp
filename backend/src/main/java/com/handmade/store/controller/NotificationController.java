package com.handmade.store.controller;

import com.handmade.store.dto.notification.NotificationResponse;
import com.handmade.store.security.CustomUserDetails;
import com.handmade.store.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        List<NotificationResponse> response = notificationService.getNotifications(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        long count = notificationService.getUnreadCount(currentUser.getUsername());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        NotificationResponse response = notificationService.markAsRead(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        Map<String, Object> response = notificationService.markAllAsRead(currentUser.getUsername());
        return ResponseEntity.ok(response);
    }
}
