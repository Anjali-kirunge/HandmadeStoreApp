package com.handmade.store.service;

import com.handmade.store.dto.chat.ChatMessage;

import java.util.List;

public interface HuggingFaceService {
    String generateChatResponse(List<ChatMessage> messages);
}
