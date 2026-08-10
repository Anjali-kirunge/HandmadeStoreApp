package com.handmade.store.service.impl;

import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.enums.Role;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.EmailService;
import com.handmade.store.service.LowStockService;
import com.handmade.store.service.NotificationService;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class LowStockServiceImpl implements LowStockService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public LowStockServiceImpl(ProductRepository productRepository,
                               UserRepository userRepository,
                               NotificationService notificationService,
                               EmailService emailService) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Override
    public List<ProductResponse> getLowStockProducts(String sellerEmail) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        List<Product> sellerProducts = productRepository.findBySellerIdAndStatus(seller.getId(), ProductStatus.ACTIVE);

        return sellerProducts.stream()
                .filter(product -> product.getStockQuantity() < LOW_STOCK_THRESHOLD)
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ProductResponse> getAllLowStockProducts() {
        List<Product> allActiveProducts = productRepository.findByStatus(ProductStatus.ACTIVE);

        return allActiveProducts.stream()
                .filter(product -> product.getStockQuantity() < LOW_STOCK_THRESHOLD)
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Async
    public void checkAndNotifyLowStock() {
        List<Product> allActiveProducts = productRepository.findByStatus(ProductStatus.ACTIVE);

        List<Product> lowStockProducts = allActiveProducts.stream()
                .filter(product -> product.getStockQuantity() < LOW_STOCK_THRESHOLD)
                .collect(Collectors.toList());

        if (lowStockProducts.isEmpty()) {
            return;
        }

        List<User> admins = userRepository.findByRole(Role.ROLE_ADMIN);

        StringBuilder adminEmailBody = new StringBuilder();
        adminEmailBody.append("Low Stock Alert Report\n");
        adminEmailBody.append("========================\n\n");
        adminEmailBody.append("The following products have stock below ")
                .append(LOW_STOCK_THRESHOLD).append(" units:\n\n");

        for (Product product : lowStockProducts) {
            User seller = product.getSeller();
            String sellerEmail = seller.getEmail();
            String sellerName = seller.getFirstName() + " " + seller.getLastName();

            notificationService.createNotification(
                    seller.getId(),
                    "Low Stock Warning",
                    "Product \"" + product.getName() + "\" has only " + product.getStockQuantity() + " units remaining. Please restock soon.",
                    "/seller/products"
            );

            emailService.sendEmail(
                    sellerEmail,
                    "Low Stock Alert - " + product.getName(),
                    "Hello " + sellerName + ",\n\n"
                            + "Your product \"" + product.getName() + "\" (SKU: " + product.getSku() + ") "
                            + "is running low on stock.\n\n"
                            + "Current Stock: " + product.getStockQuantity() + " units\n\n"
                            + "Please restock as soon as possible to avoid running out.\n\n"
                            + "Thank you,\nHandmade Store Team"
            );

            adminEmailBody.append("- ").append(product.getName())
                    .append(" (SKU: ").append(product.getSku()).append(")")
                    .append(" | Stock: ").append(product.getStockQuantity())
                    .append(" | Seller: ").append(sellerEmail)
                    .append("\n");
        }

        adminEmailBody.append("\nTotal low stock products: ").append(lowStockProducts.size()).append("\n");
        adminEmailBody.append("\nPlease take necessary action.\n\n");
        adminEmailBody.append("Handmade Store Admin Panel");

        for (User admin : admins) {
            notificationService.createNotification(
                    admin.getId(),
                    "Low Stock Summary",
                    lowStockProducts.size() + " products are running low on stock. Check inventory for details.",
                    "/admin/inventory"
            );

            emailService.sendEmail(
                    admin.getEmail(),
                    "Low Stock Alert Summary - " + lowStockProducts.size() + " Products",
                    adminEmailBody.toString()
            );
        }
    }

    private ProductResponse mapToProductResponse(Product product) {
        CategoryResponse categoryResponse = null;
        if (product.getCategory() != null) {
            categoryResponse = CategoryResponse.builder()
                    .id(product.getCategory().getId())
                    .name(product.getCategory().getName())
                    .description(product.getCategory().getDescription())
                    .imageUrl(product.getCategory().getImageUrl())
                    .parentCategory(product.getCategory().getParent() != null
                            ? product.getCategory().getParent().getId() : null)
                    .createdAt(product.getCategory().getCreatedAt())
                    .build();
        }

        UserResponse sellerResponse = null;
        if (product.getSeller() != null) {
            sellerResponse = UserResponse.builder()
                    .id(product.getSeller().getId())
                    .firstName(product.getSeller().getFirstName())
                    .lastName(product.getSeller().getLastName())
                    .email(product.getSeller().getEmail())
                    .phone(product.getSeller().getPhone())
                    .avatar(product.getSeller().getAvatar())
                    .role(product.getSeller().getRole())
                    .enabled(product.getSeller().isEnabled())
                    .createdAt(product.getSeller().getCreatedAt())
                    .build();
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .discountPrice(product.getDiscountPrice())
                .stockQuantity(product.getStockQuantity())
                .imageUrl(product.getImageUrl())
                .images(product.getImages())
                .category(categoryResponse)
                .seller(sellerResponse)
                .rating(product.getRating())
                .reviewCount(product.getReviewCount())
                .status(product.getStatus())
                .isFeatured(product.isFeatured())
                .createdAt(product.getCreatedAt())
                .build();
    }
}
