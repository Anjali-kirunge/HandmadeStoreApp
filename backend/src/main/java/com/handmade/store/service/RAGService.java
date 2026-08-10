package com.handmade.store.service;

public interface RAGService {
    String getContextForQuery(String userQuery);
    String buildPrompt(String userQuery, String context);
    boolean referencesCatalog(String userQuery);
}
