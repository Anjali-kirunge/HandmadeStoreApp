package com.handmade.store.service.impl;

import com.handmade.store.entity.Category;
import com.handmade.store.entity.Product;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.repository.CategoryRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.service.CatalogAssistantService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CatalogAssistantServiceImpl implements CatalogAssistantService {

    private static final int MAX_LIST_ITEMS = 10;
    private static final int LOW_STOCK_THRESHOLD = 15;

    private static final Set<String> STOPWORDS = Set.of(
            "what", "which", "where", "when", "who", "why", "how", "much", "many", "show", "tell",
            "me", "about", "please", "can", "you", "your", "yours", "i", "we", "us", "want",
            "wanted", "need", "would", "could", "should", "shall", "the", "a", "an", "is", "are",
            "was", "were", "am", "be", "do", "does", "did", "doing", "for", "of", "and", "or",
            "in", "on", "with", "have", "has", "had", "any", "some", "give", "gives", "list",
            "price", "prices", "cost", "costs", "cheap", "cheaper", "expensive", "available",
            "availability", "products", "product", "items", "item", "there", "this", "that",
            "these", "those", "find", "looking", "buy", "purchase", "selling", "sale", "sold",
            "hi", "hello", "hey", "thanks", "thank", "category", "categories", "recommend",
            "recommendation", "suggest", "suggestion", "know", "got",
            "under", "below", "above", "over", "less", "more", "than", "within", "between",
            "to", "upto", "up", "max", "maximum", "min", "minimum", "budget", "stock",
            "stocks", "out", "handmade", "handcrafted", "crafted", "nice", "good", "best",
            "great", "one", "all", "top", "new", "newest", "latest");

    private static final Set<String> SOCIAL_WORDS = Set.of(
            "hi", "hii", "hiii", "hey", "heya", "hello", "hola", "namaste", "yo", "greetings",
            "there", "guys", "everyone", "thanks", "thank", "thankyou", "thx", "ty", "bye",
            "goodbye", "ok", "okay", "nice", "cool", "awesome", "perfect", "sure",
            "yes", "no", "okayy", "welcome", "noo", "yeah");

    private static final Pattern PRICE_WITH_MAX = Pattern.compile(
            "(?:under|below|less than|cheaper than|within|upto|up to|not more than|max|maximum|budget|at most)\\s*(?:rs\\.?|rupees?|inr)?\\s*(?:₹)?\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_WITH_MIN = Pattern.compile(
            "(?:above|over|more than|at least|min|minimum|greater than|from)\\s*(?:rs\\.?|rupees?|inr)?\\s*(?:₹)?\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PRICE_BETWEEN = Pattern.compile(
            "between\\s*(?:rs\\.?|rupees?|inr)?\\s*(?:₹)?\\s*(\\d+(?:\\.\\d+)?)\\s*(?:and|to|-)\\s*(?:rs\\.?|rupees?|inr)?\\s*(?:₹)?\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern CURRENCY_NUMBER = Pattern.compile(
            "(?:₹|rs\\.?|rupees?|inr)\\s*(\\d+(?:\\.\\d+)?)",
            Pattern.CASE_INSENSITIVE);

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public CatalogAssistantServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public String answer(String userQuery) {
        if (userQuery == null || userQuery.isBlank()) {
            return helpHint();
        }
        String q = normalize(userQuery);

        if (isSocialOnly(q)) {
            return "Hi there! I can help you find products, prices, availability and categories in our store. "
                    + "Try asking: \"Show me handmade bags\" or \"What is the price of Leather Crossbody Bag?\"";
        }
        if (isCategoryListIntent(q)) {
            return categoriesAnswer();
        }
        if (isHelpIntent(q)) {
            return helpHint();
        }

        PriceBounds bounds = extractBounds(q);
        List<String> keywords = extractKeywords(q);
        Category category = matchCategory(q);

        boolean priceIntent = isPriceIntent(q);
        boolean stockIntent = isStockIntent(q);
        boolean infoIntent = isInfoIntent(q);

        List<Product> allActive = productRepository.findByStatus(ProductStatus.ACTIVE);

        // 1. Specific product question ("price of X", "do you have X", "about X")
        Product specific = bestSpecificMatch(allActive, keywords, q);
        if (specific != null && (priceIntent || stockIntent || infoIntent || keywordsContainFullName(keywords, specific))) {
            return specificProductAnswer(specific, priceIntent, stockIntent);
        }

        // 2. Budget/price filter without a specific product
        if (bounds.hasAny()) {
            return budgetAnswer(allActive, category, keywords, bounds);
        }

        // 3. "Tell me about this product" without naming a product
        if (infoIntent && (keywords.isEmpty() || q.contains("tell me about this product"))) {
            return "Sure! Which product would you like to know about? Please share the product name, "
                    + "for example \"Leather Crossbody Bag\" or \"Traditional Kundan Set\".";
        }

        // 4. Stock / availability question
        if (stockIntent) {
            return stockAnswer(allActive);
        }

        // 5. General search by category or keywords
        List<Product> matches = searchProducts(allActive, category, keywords);
        if (!matches.isEmpty()) {
            return searchAnswer(matches, category, keywords, q);
        }

        // 6. No keywords / no category -> catalog overview
        if (keywords.isEmpty() && category == null) {
            return overviewAnswer(allActive);
        }

        // 7. Nothing found -> never invent, offer a truthful alternative
        return notFoundAnswer(keywords, category, allActive);
    }

    // ── Intent detection ────────────────────────────────────────────────

    private boolean isSocialOnly(String q) {
        String cleaned = q.replaceAll("[^a-z\\s]", " ").trim();
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

    private boolean isCategoryListIntent(String q) {
        return q.contains("what categories") || q.contains("which categories")
                || q.contains("categories do you have") || q.contains("categories are")
                || q.contains("list of categories") || q.contains("category list")
                || q.contains("available categories") || q.contains("categories available")
                || q.equals("categories") || q.contains("your categories")
                || (q.contains("categories") && (q.contains("what") || q.contains("which") || q.contains("list")));
    }

    private boolean isHelpIntent(String q) {
        return q.contains("help") || q.contains("what can you do")
                || q.contains("how do you work") || q.contains("how can you help")
                || q.contains("what do you do") || q.contains("guide me");
    }

    private boolean isPriceIntent(String q) {
        return q.contains("price") || q.contains("prices") || q.contains("cost")
                || q.contains("costs") || q.contains("how much") || q.contains("rate")
                || q.contains("what is the price") || q.contains("whats the price")
                || q.contains("what does") || q.contains("whats") || q.contains("inr")
                || q.contains("rupees") || q.contains(" rs") || q.contains("₹");
    }

    private boolean isStockIntent(String q) {
        return q.contains("stock") || q.contains("in stock") || q.contains("availability")
                || q.contains("available") || q.contains("how many") || q.contains("quantity")
                || q.contains("out of stock") || q.contains("left");
    }

    private boolean isInfoIntent(String q) {
        return q.contains("tell me about") || q.contains("about this product")
                || q.contains("about the product") || q.contains("do you have")
                || q.contains("do you sell") || q.contains("details")
                || q.contains("tell me about");
    }

    // ── Data helpers ────────────────────────────────────────────────────

    private static final class PriceBounds {
        BigDecimal min;
        BigDecimal max;
        boolean hasMin;
        boolean hasMax;

        boolean hasAny() {
            return hasMin || hasMax;
        }
    }

    private PriceBounds extractBounds(String q) {
        PriceBounds bounds = new PriceBounds();
        Matcher between = PRICE_BETWEEN.matcher(q);
        if (between.find()) {
            bounds.min = new BigDecimal(between.group(1));
            bounds.max = new BigDecimal(between.group(2));
            bounds.hasMin = true;
            bounds.hasMax = true;
            return bounds;
        }
        Matcher max = PRICE_WITH_MAX.matcher(q);
        if (max.find()) {
            bounds.max = new BigDecimal(max.group(1));
            bounds.hasMax = true;
        }
        Matcher min = PRICE_WITH_MIN.matcher(q);
        if (min.find()) {
            bounds.min = new BigDecimal(min.group(1));
            bounds.hasMin = true;
        }
        // A bare currency number without a bound word is treated as "around this amount"
        if (!bounds.hasAny()) {
            Matcher num = CURRENCY_NUMBER.matcher(q);
            if (num.find()) {
                BigDecimal value = new BigDecimal(num.group(1));
                if (isLowerBoundContext(q)) {
                    bounds.min = value;
                    bounds.hasMin = true;
                } else {
                    bounds.max = value.add(new BigDecimal("50"));
                    bounds.hasMax = true;
                    bounds.min = value.subtract(new BigDecimal("50"));
                    bounds.hasMin = true;
                }
            }
        }
        return bounds;
    }

    private boolean isLowerBoundContext(String q) {
        return q.contains("above") || q.contains("over") || q.contains("more than") || q.contains("at least");
    }

    private List<String> extractKeywords(String q) {
        List<String> keywords = new ArrayList<>();
        String cleaned = q.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9\\s-]", " ").trim();
        for (String token : cleaned.split("\\s+")) {
            if (token.length() > 2 && !STOPWORDS.contains(token) && !SOCIAL_WORDS.contains(token)) {
                keywords.add(token);
            }
        }
        return keywords;
    }

    private Category matchCategory(String q) {
        List<Category> categories = categoryRepository.findAll();
        if (categories.isEmpty()) {
            return null;
        }
        for (String keyword : extractKeywords(q)) {
            String kw = keyword.toLowerCase(Locale.ROOT);
            for (Category category : categories) {
                if (category == null || category.getName() == null) {
                    continue;
                }
                String name = category.getName().toLowerCase(Locale.ROOT);
                if (name.contains(kw) || kw.contains(name)) {
                    return category;
                }
            }
        }
        return null;
    }

    private Product bestSpecificMatch(List<Product> products, List<String> keywords, String q) {
        if (keywords.isEmpty()) {
            return null;
        }
        Product best = null;
        int bestScore = 0;
        for (Product product : products) {
            int score = nameScore(product.getName(), keywords);
            if (score > bestScore) {
                bestScore = score;
                best = product;
            }
        }
        // A specific product is identified when several of its name words appear in the question.
        if (bestScore < 2) {
            return null;
        }
        return best;
    }

    private boolean keywordsContainFullName(List<String> keywords, Product product) {
        String name = product.getName().toLowerCase(Locale.ROOT);
        int hits = 0;
        for (String keyword : keywords) {
            if (name.contains(keyword)) {
                hits++;
            }
        }
        return hits >= 3 || hits == keywords.size();
    }

    private int nameScore(String productName, List<String> keywords) {
        String name = productName.toLowerCase(Locale.ROOT);
        int score = 0;
        for (String keyword : keywords) {
            if (name.contains(keyword)) {
                score++;
            } else if (keyword.length() > 3 && keyword.endsWith("s")) {
                // Tolerant singular/plural matching ("candles" vs "candle", "bags" vs "bag").
                String singular = keyword.substring(0, keyword.length() - 1);
                if (name.contains(singular)) {
                    score++;
                }
            }
        }
        return score;
    }

    private List<Product> searchProducts(List<Product> allActive, Category category, List<String> keywords) {
        List<Product> results = new ArrayList<>();
        Set<Long> seen = new LinkedHashSet<>();
        if (category != null) {
            addUnique(results, seen, allActive.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(category.getId()))
                    .toList());
        }
        if (results.isEmpty()) {
            for (String keyword : keywords) {
                addUnique(results, seen, productRepository.searchProducts(
                        keyword, null, null, null, PageRequest.of(0, 40)).getContent());
                if (keyword.length() > 3 && keyword.endsWith("s")) {
                    addUnique(results, seen, productRepository.searchProducts(
                            keyword.substring(0, keyword.length() - 1), null, null, null,
                            PageRequest.of(0, 40)).getContent());
                }
            }
        }
        if (results.isEmpty() && category != null) {
            addUnique(results, seen, allActive.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(category.getId()))
                    .toList());
        }
        // If nothing matched, try tolerant (fuzzy) matching against product names.
        if (results.isEmpty() && !keywords.isEmpty()) {
            addUnique(results, seen, fuzzyMatch(allActive, keywords));
        }
        results.sort(Comparator
                .comparingInt((Product p) -> -nameScore(p.getName(), keywords))
                .thenComparing(Comparator.comparingDouble(Product::getRating).reversed())
                .thenComparing(Comparator.comparingInt(Product::getReviewCount).reversed()));
        return results;
    }

    private List<Product> fuzzyMatch(List<Product> products, List<String> keywords) {
        List<Product> matches = new ArrayList<>();
        for (Product product : products) {
            String name = product.getName().toLowerCase(Locale.ROOT);
            String[] nameTokens = name.replaceAll("[^a-z0-9\\s]", " ").trim().split("\\s+");
            int hits = 0;
            for (String keyword : keywords) {
                if (name.contains(keyword)) {
                    hits++;
                    continue;
                }
                for (String token : nameTokens) {
                    if (token.length() >= 4 && keyword.length() >= 4
                            && levenshtein(token, keyword) <= 2) {
                        hits++;
                        break;
                    }
                }
            }
            if (hits > 0) {
                matches.add(product);
            }
        }
        return matches;
    }

    private void addUnique(List<Product> target, Set<Long> seen, List<Product> candidates) {
        for (Product product : candidates) {
            if (product != null && seen.add(product.getId())) {
                target.add(product);
            }
        }
    }

    private int levenshtein(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            prev[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[b.length()];
    }

    // ── Answer builders (all point-wise, all database-backed) ───────────

    private String categoriesAnswer() {
        List<Category> categories = categoryRepository.findAll();
        List<Product> allActive = productRepository.findByStatus(ProductStatus.ACTIVE);
        if (categories.isEmpty()) {
            return "We don't have any product categories listed yet.";
        }
        StringBuilder sb = new StringBuilder("Here are the product categories we offer:\n\n");
        for (Category category : categories) {
            long count = allActive.stream()
                    .filter(p -> p.getCategory() != null && p.getCategory().getId().equals(category.getId()))
                    .count();
            sb.append("• ").append(category.getName()).append(" – ").append(count)
                    .append(count == 1 ? " product\n" : " products\n");
        }
        sb.append("\nWant me to show products from any of these categories?");
        return sb.toString();
    }

    private String overviewAnswer(List<Product> allActive) {
        Map<Category, Long> perCategory = new LinkedHashMap<>();
        for (Product product : allActive) {
            Category category = product.getCategory();
            if (category == null) {
                continue;
            }
            perCategory.merge(category, 1L, Long::sum);
        }
        StringBuilder sb = new StringBuilder();
        sb.append("We currently have ").append(allActive.size())
                .append(" handcrafted products across ").append(perCategory.size()).append(" categories:\n\n");
        for (Map.Entry<Category, Long> entry : perCategory.entrySet()) {
            sb.append("• ").append(entry.getKey().getName()).append(" – ").append(entry.getValue())
                    .append(entry.getValue() == 1 ? " product\n" : " products\n");
        }
        sb.append("\nTop rated picks:\n\n");
        List<Product> top = allActive.stream()
                .sorted(Comparator.comparingDouble(Product::getRating).reversed()
                        .thenComparing(Comparator.comparingInt(Product::getReviewCount).reversed()))
                .limit(5).toList();
        for (Product product : top) {
            sb.append("• ").append(product.getName()).append(" – ").append(formatSellingPrice(product))
                    .append(" – ").append(product.getRating()).append("★\n");
        }
        return sb.toString();
    }

    private String budgetAnswer(List<Product> allActive, Category category, List<String> keywords, PriceBounds bounds) {
        List<String> nameKeywords = keywords.stream()
                .filter(k -> !k.matches("\\d+(\\.\\d+)?"))
                .toList();
        List<Product> filtered = allActive.stream()
                .filter(p -> category == null || (p.getCategory() != null && p.getCategory().getId().equals(category.getId())))
                .filter(p -> sellingPrice(p).compareTo(bounds.max == null ? BigDecimal.ZERO : bounds.max) <= 0)
                .filter(p -> bounds.min == null || sellingPrice(p).compareTo(bounds.min) >= 0)
                .filter(p -> !nameKeywords.isEmpty() ? nameScore(p.getName(), nameKeywords) > 0 : true)
                .sorted(Comparator.comparingDouble(Product::getRating).reversed())
                .toList();
        if (filtered.isEmpty()) {
            return "We don't currently have any products matching that price range. "
                    + "Would you like to see what we do have in our store?";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("Here").append(filtered.size() == 1 ? " is the product" : " are the products");
        sb.append(" within your range:\n\n");
        List<Product> shown = filtered.stream().limit(MAX_LIST_ITEMS).toList();
        for (Product product : shown) {
            sb.append("• ").append(product.getName()).append(" – ").append(formatSellingPrice(product))
                    .append(" – ").append(product.getRating()).append("★\n");
        }
        if (filtered.size() > shown.size()) {
            sb.append("\nShowing ").append(shown.size()).append(" of ")
                    .append(filtered.size()).append(" matching products.");
        }
        return sb.toString();
    }

    private String stockAnswer(List<Product> allActive) {
        long inStock = allActive.stream().filter(p -> p.getStockQuantity() != null && p.getStockQuantity() > 0).count();
        long out = allActive.size() - inStock;
        if (out == 0) {
            StringBuilder sb = new StringBuilder();
            sb.append("All ").append(allActive.size())
                    .append(" products are currently in stock. Here are the ones with limited stock:\n\n");
            List<Product> low = allActive.stream()
                    .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() <= LOW_STOCK_THRESHOLD)
                    .sorted(Comparator.comparing(Product::getStockQuantity))
                    .limit(MAX_LIST_ITEMS).toList();
            if (low.isEmpty()) {
                sb.append("• Every product has healthy stock levels.");
            } else {
                for (Product product : low) {
                    sb.append("• ").append(product.getName()).append(" – ").append(formatSellingPrice(product))
                            .append(" – only ").append(product.getStockQuantity()).append(" left\n");
                }
            }
            return sb.toString();
        }
        return "We have " + inStock + " products in stock and " + out
                + " currently out of stock. Ask me about a specific product for its exact availability.";
    }

    private String searchAnswer(List<Product> matches, Category category, List<String> keywords, String q) {
        StringBuilder sb = new StringBuilder();
        if (category != null) {
            sb.append("Here are the products in ").append(category.getName()).append(":\n\n");
        } else {
            sb.append("Here's what I found for \"").append(q.trim()).append("\":\n\n");
        }
        List<Product> shown = matches.stream().limit(MAX_LIST_ITEMS).toList();
        for (Product product : shown) {
            sb.append("• ").append(product.getName()).append(" – ").append(formatSellingPrice(product))
                    .append(" – ").append(product.getRating()).append("★ – ")
                    .append(stockLabel(product)).append("\n");
        }
        if (matches.size() > shown.size()) {
            sb.append("\nShowing ").append(shown.size()).append(" of ").append(matches.size())
                    .append(" matching products.");
        }
        return sb.toString();
    }

    private String specificProductAnswer(Product product, boolean priceIntent, boolean stockIntent) {
        StringBuilder sb = new StringBuilder();
        if (priceIntent) {
            sb.append("The price of ").append(product.getName()).append(" is ")
                    .append(formatSellingPrice(product)).append(".");
            if (hasDiscount(product)) {
                sb.append(" (MRP ").append(formatMoney(product.getPrice())).append(")");
            }
            sb.append("\n\n• Category: ").append(categoryName(product));
            sb.append("\n• Availability: ").append(stockLabel(product));
            sb.append("\n• Rating: ").append(product.getRating()).append("★ (")
                    .append(product.getReviewCount()).append(" reviews)");
            return sb.toString();
        }
        if (stockIntent) {
            sb.append(product.getName()).append(" is ").append(stockLabel(product)).append(".\n\n");
            sb.append("• Price: ").append(formatSellingPrice(product));
            if (hasDiscount(product)) {
                sb.append(" (MRP ").append(formatMoney(product.getPrice())).append(")");
            }
            sb.append("\n• Category: ").append(categoryName(product));
            sb.append("\n• Rating: ").append(product.getRating()).append("★ (")
                    .append(product.getReviewCount()).append(" reviews)");
            return sb.toString();
        }
        sb.append("Yes, we have ").append(product.getName()).append("! Here are the details:\n\n");
        sb.append("• Category: ").append(categoryName(product)).append("\n");
        sb.append("• Price: ").append(formatSellingPrice(product));
        if (hasDiscount(product)) {
            sb.append(" (MRP ").append(formatMoney(product.getPrice())).append(")");
        }
        sb.append("\n• Availability: ").append(stockLabel(product)).append("\n");
        sb.append("• Rating: ").append(product.getRating()).append("★ (")
                .append(product.getReviewCount()).append(" reviews)\n");
        String description = product.getDescription();
        if (description != null && !description.isBlank()) {
            String trimmed = description.trim();
            if (trimmed.length() > 160) {
                trimmed = trimmed.substring(0, 160) + "...";
            }
            sb.append("• About: ").append(trimmed).append("\n");
        }
        return sb.toString();
    }

    private String notFoundAnswer(List<String> keywords, Category category, List<Product> allActive) {
        StringBuilder sb = new StringBuilder();
        String term = keywords.isEmpty()
                ? (category != null ? category.getName() : "that")
                : String.join(" ", keywords);
        sb.append("Sorry, we don't currently have \"").append(term)
                .append("\" in our catalog. I never guess, so I can only tell you what's actually in the store.\n\n");
        if (!allActive.isEmpty()) {
            sb.append("You might like these instead:\n\n");
            List<Product> top = allActive.stream()
                    .sorted(Comparator.comparingDouble(Product::getRating).reversed())
                    .limit(5).toList();
            for (Product product : top) {
                sb.append("• ").append(product.getName()).append(" – ").append(formatSellingPrice(product))
                        .append(" – ").append(product.getRating()).append("★\n");
            }
        }
        return sb.toString();
    }

    private String helpHint() {
        return "I'm your Handmade Store shopping assistant. I can answer from our live catalog:\n\n"
                + "• \"Show me handmade bags\"\n"
                + "• \"What products are available?\"\n"
                + "• \"What is the price of Leather Crossbody Bag?\"\n"
                + "• \"Show products under ₹1000\"\n"
                + "• \"What categories do you have?\"\n"
                + "• \"Which products are in stock?\"";
    }

    // ── Formatting helpers ──────────────────────────────────────────────

    private String formatSellingPrice(Product product) {
        BigDecimal selling = sellingPrice(product);
        String base = formatMoney(selling);
        if (hasDiscount(product)) {
            return base + " (was " + formatMoney(product.getPrice()) + ")";
        }
        return base;
    }

    private BigDecimal sellingPrice(Product product) {
        return product.getDiscountPrice() != null ? product.getDiscountPrice() : product.getPrice();
    }

    private boolean hasDiscount(Product product) {
        return product.getDiscountPrice() != null && product.getPrice() != null
                && product.getDiscountPrice().compareTo(product.getPrice()) < 0;
    }

    private String formatMoney(BigDecimal value) {
        if (value == null) {
            return "n/a";
        }
        return "₹" + value.stripTrailingZeros().toPlainString();
    }

    private String stockLabel(Product product) {
        if (product.getStockQuantity() == null || product.getStockQuantity() <= 0) {
            return "out of stock";
        }
        if (product.getStockQuantity() <= LOW_STOCK_THRESHOLD) {
            return "in stock (only " + product.getStockQuantity() + " left)";
        }
        return "in stock";
    }

    private String categoryName(Product product) {
        return product.getCategory() != null ? product.getCategory().getName() : "Uncategorized";
    }

    private String normalize(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[’‘]", "'")
                .replaceAll("[^a-z0-9₹&\\s-]", " ")
                .trim();
    }
}
