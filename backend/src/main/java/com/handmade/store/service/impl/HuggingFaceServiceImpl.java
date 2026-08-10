package com.handmade.store.service.impl;

import com.handmade.store.dto.chat.ChatMessage;
import com.handmade.store.exception.AiServiceException;
import com.handmade.store.service.HuggingFaceService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class HuggingFaceServiceImpl implements HuggingFaceService {

    private static final Logger log = LoggerFactory.getLogger(HuggingFaceServiceImpl.class);
    private static final String HF_CHAT_COMPLETIONS_URL = "https://router.huggingface.co/v1/chat/completions";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;
    private final String fallbackModel;

    public HuggingFaceServiceImpl(
            @Value("${hf.api-key:}") String apiKey,
            @Value("${hf.model:google/gemma-2-2b-it}") String model,
            @Value("${hf.fallback-model:google/gemma-3-4b-it}") String fallbackModel) {
        this.apiKey = apiKey;
        this.model = model;
        this.fallbackModel = fallbackModel;

        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout((int) Duration.ofSeconds(10).toMillis());
        requestFactory.setReadTimeout((int) Duration.ofSeconds(90).toMillis());

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .baseUrl("https://router.huggingface.co")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public String generateChatResponse(List<ChatMessage> messages) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiServiceException("The AI assistant is not configured. Please contact the store administrator.");
        }
        if (messages == null || messages.isEmpty()) {
            throw new AiServiceException("No messages were provided to the AI assistant.");
        }

        try {
            return callChatCompletions(model, messages);
        } catch (RestClientException ex) {
            log.warn("Hugging Face chat completion request failed: {}", ex.getMessage());
            throw new AiServiceException("The AI assistant is temporarily unavailable. Please try again in a moment.", ex);
        }
    }

    private String callChatCompletions(String model, List<ChatMessage> messages) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("model", model);
        payload.put("messages", messages);
        payload.put("max_tokens", 512);
        payload.put("temperature", 0.6);
        payload.put("stream", false);

        try {
            Map<String, Object> response = restClient.post()
                    .uri(HF_CHAT_COMPLETIONS_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {
                    });
            return extractReply(response);
        } catch (RestClientResponseException ex) {
            if (isModelNotSupported(ex) && !model.equals(fallbackModel)) {
                log.warn("Model '{}' is not supported by the enabled providers. Falling back to '{}'.", model, fallbackModel);
                return callChatCompletions(fallbackModel, messages);
            }
            throw ex;
        }
    }

    private boolean isModelNotSupported(RestClientResponseException ex) {
        try {
            String body = ex.getResponseBodyAsString();
            return body != null && (body.contains("model_not_supported") || body.contains("not supported"));
        } catch (Exception ignored) {
            return false;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> response) {
        if (response == null) {
            throw new AiServiceException("The AI assistant returned an empty response.");
        }

        if (response.get("error") != null) {
            Object error = response.get("error");
            String detail = error instanceof Map ? String.valueOf(((Map<?, ?>) error).get("message")) : String.valueOf(error);
            throw new AiServiceException("The AI assistant could not process your request. " + detail);
        }

        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices == null || choices.isEmpty()) {
                throw new AiServiceException("The AI assistant returned no replies.");
            }
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String content = message == null ? null : (String) message.get("content");
            if (content == null || content.isBlank()) {
                throw new AiServiceException("The AI assistant returned an empty reply.");
            }
            return cleanupText(content.trim());
        } catch (ClassCastException | NullPointerException ex) {
            throw new AiServiceException("The AI assistant returned an unexpected response format.", ex);
        }
    }

    private String cleanupText(String text) {
        // Replace mangled unicode replacement characters caused by mismatched encoding
        // (commonly an apostrophe such as "Here’s" arriving as "Here�??s").
        String cleaned = text
                .replace("\uFFFD??", "'")
                .replace("\uFFFD", "'")
                .replace("â€™", "'")
                .replace("â€œ", "\"")
                .replace("â€", "\"");
        // Decode emoji that arrived as literal surrogate-pair escapes like \uD83D\uDE0A.
        cleaned = decodeSurrogateEscapes(cleaned);
        // Collapse any accidental multi-space runs.
        return cleaned.replaceAll(" {3,}", "  ").trim();
    }

    private String decodeSurrogateEscapes(String text) {
        Pattern pair = Pattern.compile("\\\\u([dD][89a-fA-F][0-9a-fA-F]{2})\\\\u([dD][c-fC-F][0-9a-fA-F]{2})");
        Matcher matcher = pair.matcher(text);
        StringBuffer sb = new StringBuffer();
        while (matcher.find()) {
            int high = Integer.parseInt(matcher.group(1), 16);
            int low = Integer.parseInt(matcher.group(2), 16);
            int codePoint = 0x10000 + ((high - 0xD800) << 10) + (low - 0xDC00);
            matcher.appendReplacement(sb, Matcher.quoteReplacement(new String(Character.toChars(codePoint))));
        }
        matcher.appendTail(sb);
        return sb.toString();
    }
}
