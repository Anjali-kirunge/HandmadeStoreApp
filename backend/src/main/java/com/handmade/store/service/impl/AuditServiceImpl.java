package com.handmade.store.service.impl;

import com.handmade.store.entity.AuditLog;
import com.handmade.store.repository.AuditLogRepository;
import com.handmade.store.service.AuditService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class AuditServiceImpl implements AuditService {

    private final AuditLogRepository auditLogRepository;

    public AuditServiceImpl(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Override
    @Async
    public void log(String userId, String action, String entity, Long entityId, String oldValues, String newValues, String ipAddress) {
        try {
            Long uid = null;
            if (userId != null && !userId.isEmpty()) {
                try { uid = Long.parseLong(userId); } catch (NumberFormatException ignored) {}
            }
            AuditLog auditLog = AuditLog.builder()
                    .userId(uid)
                    .action(action)
                    .entity(entity)
                    .entityId(entityId)
                    .oldValues(oldValues)
                    .newValues(newValues)
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception ignored) {
        }
    }
}
