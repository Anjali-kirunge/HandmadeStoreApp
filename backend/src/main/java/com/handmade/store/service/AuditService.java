package com.handmade.store.service;

public interface AuditService {
    void log(String userId, String action, String entity, Long entityId, String oldValues, String newValues, String ipAddress);
}
