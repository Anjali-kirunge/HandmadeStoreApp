package com.handmade.store.controller;

import com.handmade.store.dto.chat.ChatRequest;
import com.handmade.store.dto.chat.ChatResponse;
import com.handmade.store.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/chat")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public ResponseEntity<ChatResponse> chat(@RequestBody @Valid ChatRequest request) {
        String reply = chatService.getChatResponse(request);
        return ResponseEntity.ok(new ChatResponse(reply));
    }
}
