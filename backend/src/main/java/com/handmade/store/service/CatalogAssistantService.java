package com.handmade.store.service;

/**
 * Deterministic, database-driven assistant for catalog questions.
 * <p>
 * Every answer is built strictly from the data available in the database through
 * the existing repositories. The service never invents products, prices, stock,
 * ratings or categories. Responses are formatted in a short, point-wise style.
 */
public interface CatalogAssistantService {

    /**
     * Builds a point-wise answer for a catalog-related user question.
     *
     * @param userQuery the raw user question (may contain typos / natural language)
     * @return a formatted, database-backed answer
     */
    String answer(String userQuery);
}
