package com.handmade.store.service.impl;

import com.handmade.store.dto.notification.NotificationResponse;
import com.handmade.store.entity.Notification;
import com.handmade.store.entity.User;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.NotificationRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.NotificationService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public NotificationResponse createNotification(Long userId, String title, String message, String link) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        return mapToNotificationResponse(notification);
    }

    @Override
    public List<NotificationResponse> getNotifications(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return notificationRepository.findByUserId(user.getId()).stream()
                .map(this::mapToNotificationResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));

        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return mapToNotificationResponse(notification);
    }

    @Override
    @Transactional
    public Map<String, Object> markAllAsRead(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        List<Notification> unreadNotifications = notificationRepository
                .findByUserIdAndIsReadFalse(user.getId());

        unreadNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadNotifications);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "All notifications marked as read");
        result.put("count", unreadNotifications.size());
        return result;
    }

    @Override
    public long getUnreadCount(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    private NotificationResponse mapToNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .isRead(notification.isRead())
                .link(notification.getLink())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
