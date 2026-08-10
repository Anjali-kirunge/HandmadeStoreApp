package com.handmade.store.util;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

public class ApiResponse {
    public static Map<String, Object> success(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", message);
        response.put("success", true);
        return response;
    }

    public static Map<String, Object> success(String message, Object data) {
        Map<String, Object> response = success(message);
        response.put("data", data);
        return response;
    }

    public static Map<String, Object> error(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("timestamp", LocalDateTime.now().toString());
        response.put("message", message);
        response.put("success", false);
        return response;
    }

    public static Map<String, Object> error(String message, Object errors) {
        Map<String, Object> response = error(message);
        response.put("errors", errors);
        return response;
    }
}
