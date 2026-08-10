package com.handmade.store.service.impl;

import com.handmade.store.entity.Category;
import com.handmade.store.entity.Product;
import com.handmade.store.repository.CategoryRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.service.RAGService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RAGServiceImpl implements RAGService {

    private static final int MAX_PRODUCTS = 15;
    private static final int MAX_DESCRIPTION_LENGTH = 140;

    private static final Set<String> STOPWORDS = Set.of(
            "what", "which", "where", "when", "who", "why", "how", "much", "many", "show", "tell",
            "me", "about", "please", "can", "you", "your", "i", "we", "want", "need", "would",
            "could", "should", "the", "a", "an", "is", "are", "was", "were", "do", "does", "did",
            "for", "of", "and", "or", "in", "on", "with", "have", "has", "any", "some", "give",
            "list", "price", "cost", "cheap", "expensive", "available", "products", "product",
            "items", "item", "there", "this", "that", "these", "those", "find", "looking", "buy",
            "selling", "sale", "hi", "hello", "hey", "thanks", "thank", "category", "categories",
            "recommend", "suggest", "know", "doyou", "tellme", "knowabout", "to", "sold");

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public RAGServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public String getContextForQuery(String userQuery) {
        List<Category> categories = categoryRepository.findAll();
        List<String> keywords = extractKeywords(userQuery);

        List<Product> products = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();

        for (String keyword : keywords) {
            addUnique(products, seen, productRepository.searchProducts(
                    keyword, null, null, null, PageRequest.of(0, MAX_PRODUCTS)).getContent());
        }

        for (Category category : categories) {
            if (categoryMatches(category, keywords)) {
                addUnique(products, seen, productRepository.searchProducts(
                        null, category.getId(), null, null, PageRequest.of(0, MAX_PRODUCTS)).getContent());
            }
        }

        if (products.isEmpty() && keywords.isEmpty()) {
            int perCategory = Math.max(1, MAX_PRODUCTS / Math.max(1, categories.size()));
            for (Category category : categories) {
                if (products.size() >= MAX_PRODUCTS) {
                    break;
                }
                addUnique(products, seen, productRepository.searchProducts(
                        null, category.getId(), null, null, PageRequest.of(0, perCategory)).getContent());
            }
        }

        if (products.size() > MAX_PRODUCTS) {
            products = new ArrayList<>(products.subList(0, MAX_PRODUCTS));
        }

        StringBuilder context = new StringBuilder();

        if (!categories.isEmpty()) {
            context.append("Store categories: ");
            context.append(categories.stream().map(Category::getName).collect(Collectors.joining(", ")));
            context.append(".\n");
        }

        context.append("Product catalog (").append(products.size()).append(" products):\n");
        for (Product product : products) {
            String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Uncategorized";
            BigDecimal price = product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
            String description = product.getDescription() != null ? product.getDescription().trim() : "";
            if (description.length() > MAX_DESCRIPTION_LENGTH) {
                description = description.substring(0, MAX_DESCRIPTION_LENGTH) + "...";
            }
            context.append("- ").append(product.getName())
                    .append(" | category: ").append(categoryName)
                    .append(" | price: INR ").append(price)
                    .append(" | rating: ").append(product.getRating() != null ? product.getRating() : 0.0)
                    .append(" | description: ").append(description.isEmpty() ? "No description available." : description)
                    .append("\n");
        }

        return context.toString();
    }

    @Override
    public String buildPrompt(String userQuery, String context) {
        return "CATALOG DATA:\n"
                + context
                + "\nCustomer question: "
                + (userQuery == null ? "" : userQuery.trim());
    }

    @Override
    @Transactional(readOnly = true)
    public boolean referencesCatalog(String userQuery) {
        List<String> keywords = extractKeywords(userQuery);
        if (keywords.isEmpty()) {
            return false;
        }
        for (Category category : categoryRepository.findAll()) {
            if (categoryMatches(category, keywords)) {
                return true;
            }
        }
        for (String keyword : keywords) {
            if (!productRepository.searchProducts(
                    keyword, null, null, null, PageRequest.of(0, 1)).getContent().isEmpty()) {
                return true;
            }
        }
        return false;
    }

    private boolean categoryMatches(Category category, List<String> keywords) {
        if (category == null || category.getName() == null || keywords.isEmpty()) {
            return false;
        }
        String name = category.getName().toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            String kw = keyword.toLowerCase(Locale.ROOT);
            if (name.contains(kw) || kw.contains(name)) {
                return true;
            }
        }
        return false;
    }

    private void addUnique(List<Product> target, Set<Long> seen, List<Product> candidates) {
        for (Product product : candidates) {
            if (seen.add(product.getId())) {
                target.add(product);
            }
        }
    }

    private List<String> extractKeywords(String query) {
        List<String> keywords = new ArrayList<>();
        if (query == null || query.isBlank()) {
            return keywords;
        }
        String cleaned = query.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s-]", " ")
                .trim();
        for (String token : cleaned.split("\\s+")) {
            if (token.length() > 2 && !STOPWORDS.contains(token)) {
                keywords.add(token);
            }
        }
        return keywords;
    }
}
