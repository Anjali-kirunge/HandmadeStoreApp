package com.handmade.store.service;

import com.handmade.store.dto.chat.ChatRequest;

public interface ChatService {
    String getChatResponse(ChatRequest request);
}
