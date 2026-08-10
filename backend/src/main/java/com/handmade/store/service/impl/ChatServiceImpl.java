package com.handmade.store.service.impl;

import com.handmade.store.dto.chat.ChatMessage;
import com.handmade.store.dto.chat.ChatRequest;
import com.handmade.store.service.CatalogAssistantService;
import com.handmade.store.service.ChatService;
import com.handmade.store.service.HuggingFaceService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ChatServiceImpl implements ChatService {

    private static final int MAX_HISTORY_MESSAGES = 10;

    private static final String GENERAL_SYSTEM_INSTRUCTIONS =
            "You are a friendly customer-service assistant for Handmade Store, an online marketplace for handcrafted, "
                    + "hand-painted and artisan products (home decor, handmade jewelry, bags and accessories, gifts and crafts).\n"
                    + "Answer the customer's question helpfully and conversationally.\n"
                    + "FORMATTING RULES (very important):\n"
                    + "- When your answer contains more than one piece of information, ALWAYS present it as short bullet "
                    + "points or numbered points, one item per line, starting each bullet with \"-\" or \"•\".\n"
                    + "- Keep answers short, clear and easy to read. Avoid long paragraphs.\n"
                    + "- Use plain text only; do not use Markdown headers, bold, or asterisks inside words.\n"
                    + "GUIDELINES:\n"
                    + "- For greetings (hello, hi, hey), greet the customer warmly and offer to help them shop.\n"
                    + "- For questions about ordering, delivery, shipping, returns, payments, coupons, accounts or the "
                    + "store, give clear, friendly guidance in bullet points.\n"
                    + "- If you do not know something, say so honestly. Never invent specific product names, prices, "
                    + "stock, availability, shipping rates, fees or policies. When the customer asks about specific "
                    + "products, prices or stock, point them to our store catalog and politely say you can check those "
                    + "from the catalog.\n"
                    + "- Never output SQL or any database query, and never mention internal systems or implementation details.";

    private static final Set<String> CATALOG_INTENT_WORDS = Set.of(
            "price", "prices", "cost", "costs", "buy", "purchase", "available", "availability",
            "stock", "product", "products", "category", "categories", "sell", "sells",
            "selling", "offer", "offers", "recommend", "recommendation", "suggest",
            "suggestion", "show", "find", "looking", "want", "wanted", "need", "much",
            "discount", "discounts", "deals", "deal", "inr", "rupees", "range", "collection",
            "handmade", "handcrafted", "gift", "gifts", "craft", "crafts", "bag", "bags",
            "tote", "clutch", "wallet", "jewelry", "jewellery", "necklace", "earrings",
            "bracelet", "ring", "decor", "vase", "lamp", "clock", "candle", "poster",
            "painting", "art", "mirror", "boho", "macrame", "kundan", "leather", "under",
            "below", "above", "between", "do you have", "tell me about", "in stock",
            "under ₹", "under rs");

    private final HuggingFaceService huggingFaceService;
    private final CatalogAssistantService catalogAssistantService;

    public ChatServiceImpl(HuggingFaceService huggingFaceService, CatalogAssistantService catalogAssistantService) {
        this.huggingFaceService = huggingFaceService;
        this.catalogAssistantService = catalogAssistantService;
    }

    @Override
    @Transactional(readOnly = true)
    public String getChatResponse(ChatRequest request) {
        String userMessage = request.getMessage().trim();

        if (isCatalogQuery(userMessage)) {
            return catalogAssistantService.answer(userMessage);
        }

        List<ChatMessage> messages = new ArrayList<>();
        messages.add(ChatMessage.system(GENERAL_SYSTEM_INSTRUCTIONS));

        List<ChatMessage> history = request.getHistory();
        if (history != null && !history.isEmpty()) {
            int from = Math.max(0, history.size() - MAX_HISTORY_MESSAGES);
            messages.addAll(history.subList(from, history.size()));
        }

        messages.add(ChatMessage.user(userMessage));
        return huggingFaceService.generateChatResponse(messages);
    }

    private boolean isCatalogQuery(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }
        String m = message.toLowerCase(Locale.ROOT);
        if (isSocialOnly(m)) {
            return false;
        }
        for (String word : CATALOG_INTENT_WORDS) {
            if (m.contains(word)) {
                return true;
            }
        }
        // Product-name style queries without explicit catalog words are still catalog questions
        // when they are not asking about store policies.
        return !containsStoreTopic(m);
    }

    private boolean isSocialOnly(String m) {
        String cleaned = m.replaceAll("[^a-z\\s]", " ").trim();
        if (cleaned.isEmpty()) {
            return true;
        }
        for (String token : cleaned.split("\\s+")) {
            if (!SOCIAL_WORDS.contains(token)) {
                return false;
            }
        }
        return true;
    }

    private boolean containsStoreTopic(String m) {
        for (String word : STORE_TOPIC_WORDS) {
            if (m.contains(word)) {
                return true;
            }
        }
        return false;
    }

    private static final Set<String> SOCIAL_WORDS = Set.of(
            "hi", "hii", "hiii", "hey", "heya", "hello", "hola", "namaste", "yo",
            "greetings", "there", "guys", "everyone",
            "thanks", "thank", "thankyou", "thx", "ty", "bye", "goodbye", "ok", "okay",
            "great", "nice", "cool", "awesome", "perfect", "sure", "yes", "no");

    private static final Set<String> STORE_TOPIC_WORDS = Set.of(
            "shipping", "shipment", "delivery", "deliver", "track", "tracking", "tracked",
            "return", "returns", "refund", "refunds", "cancel", "cancellation", "checkout",
            "payment", "pay", "paid", "contact", "support", "account", "register", "signup",
            "login", "signin", "password", "forgot", "otp", "verify", "coupon",
            "voucher", "warranty", "exchange", "address", "hours", "open", "closed",
            "location", "phone", "email", "helpline", "deliveries", "cod", "gst", "invoice");
}
