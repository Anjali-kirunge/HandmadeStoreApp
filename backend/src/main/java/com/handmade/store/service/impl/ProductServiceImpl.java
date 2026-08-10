package com.handmade.store.service.impl;
import java.util.List;
import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.dto.common.PageResponse;
import com.handmade.store.dto.product.ProductRequest;
import com.handmade.store.dto.product.ProductResponse;
import com.handmade.store.dto.product.ProductSearchRequest;
import com.handmade.store.dto.user.UserResponse;
import com.handmade.store.entity.Category;
import com.handmade.store.entity.Product;
import com.handmade.store.entity.User;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.CategoryRepository;
import com.handmade.store.repository.ProductRepository;
import com.handmade.store.repository.UserRepository;
import com.handmade.store.service.ProductService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public ProductServiceImpl(ProductRepository productRepository,
                              UserRepository userRepository,
                              CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public ProductResponse createProduct(String sellerEmail, ProductRequest request) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        String sku = request.getSku();
        if (sku == null || sku.trim().isEmpty()) {
            sku = "HD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .sku(sku)
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .images(request.getImages() != null ? request.getImages() : new java.util.HashSet<>())
                .category(category)
                .seller(seller)
                .status(request.getStockQuantity() != null && request.getStockQuantity() == 0
                        ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE)
                .isFeatured(request.getIsFeatured() != null && request.getIsFeatured())
                .rating(0.0)
                .reviewCount(0)
                .build();

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProduct(Long id, String sellerEmail, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only update your own products");
        }

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getDiscountPrice() != null) product.setDiscountPrice(request.getDiscountPrice());
        if (request.getSku() != null && !request.getSku().trim().isEmpty()) product.setSku(request.getSku());
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
            if (request.getStockQuantity() == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            } else if (product.getStatus() == ProductStatus.OUT_OF_STOCK) {
                product.setStatus(ProductStatus.ACTIVE);
            }
        }
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getImages() != null) product.setImages(request.getImages());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
        if (request.getIsFeatured() != null) product.setFeatured(request.getIsFeatured());

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id, String sellerEmail) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only delete your own products");
        }

        productRepository.delete(product);
    }

    @Override
    public PageResponse<ProductResponse> getAllProducts(Pageable pageable) {

    Page<Product> products = productRepository.findAll(pageable);

    List<ProductResponse> productResponses = products.getContent()
            .stream()
            .map(this::mapToProductResponse)
            .toList();

    return new PageResponse<>(
            productResponses,
            products.getNumber(),
            products.getSize(),
            products.getTotalElements(),
            products.getTotalPages(),
            products.isLast()
    );
}

    @Override
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        return mapToProductResponse(product);
    }

    @Override
    public PageResponse<ProductResponse> getProductsBySeller(String sellerEmail, Pageable pageable) {
        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        Page<Product> productPage = productRepository.findBySellerId(seller.getId(), pageable);
        return mapToPageResponse(productPage);
    }

    @Override
    public PageResponse<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        Page<Product> productPage = productRepository.searchProducts(
                null, categoryId, null, null, pageable);
        return mapToPageResponse(productPage);
    }

    @Override
    public PageResponse<ProductResponse> searchProducts(ProductSearchRequest searchRequest, Pageable pageable) {
        Page<Product> productPage = productRepository.searchProducts(
                searchRequest.getKeyword(),
                searchRequest.getCategoryId(),
                searchRequest.getMinPrice(),
                searchRequest.getMaxPrice(),
                pageable);
        return mapToPageResponse(productPage);
    }

    @Override
    public PageResponse<ProductResponse> getFeaturedProducts(Pageable pageable) {
        Page<Product> productPage = productRepository.findByIsFeaturedTrue(pageable);
        return mapToPageResponse(productPage);
    }

    @Override
    @Transactional
    public ProductResponse updateStock(Long id, String sellerEmail, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        User seller = userRepository.findByEmail(sellerEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "email", sellerEmail));

        if (!product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only update stock for your own products");
        }

        int newStock = product.getStockQuantity() + quantity;
        if (newStock < 0) {
            throw new BadRequestException("Insufficient stock. Current stock: " + product.getStockQuantity());
        }

        product.setStockQuantity(newStock);
        if (newStock == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse toggleFeatured(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        product.setFeatured(!product.isFeatured());
        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse createProductAsAdmin(String adminEmail, ProductRequest request) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Admin", "email", adminEmail));

        Category category = null;
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
        }

        String sku = request.getSku();
        if (sku == null || sku.trim().isEmpty()) {
            sku = "HD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        }

        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .sku(sku)
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .images(request.getImages() != null ? request.getImages() : new java.util.HashSet<>())
                .category(category)
                .seller(admin)
                .status(request.getStockQuantity() != null && request.getStockQuantity() == 0
                        ? ProductStatus.OUT_OF_STOCK : ProductStatus.ACTIVE)
                .isFeatured(request.getIsFeatured() != null && request.getIsFeatured())
                .rating(0.0)
                .reviewCount(0)
                .build();

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateProductAsAdmin(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (request.getName() != null) product.setName(request.getName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getDiscountPrice() != null) product.setDiscountPrice(request.getDiscountPrice());
        if (request.getSku() != null) product.setSku(request.getSku());
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
            if (request.getStockQuantity() == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            } else if (product.getStatus() == ProductStatus.OUT_OF_STOCK) {
                product.setStatus(ProductStatus.ACTIVE);
            }
        }
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());
        if (request.getImages() != null) product.setImages(request.getImages());
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }
        if (request.getIsFeatured() != null) product.setFeatured(request.getIsFeatured());

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public void deleteProductAsAdmin(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));
        productRepository.delete(product);
    }

    @Override
    @Transactional
    public ProductResponse setStock(Long id, int quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (quantity < 0) {
            throw new BadRequestException("Stock quantity cannot be negative");
        }

        product.setStockQuantity(quantity);
        if (quantity == 0) {
            product.setStatus(ProductStatus.OUT_OF_STOCK);
        } else if (product.getStatus() == ProductStatus.OUT_OF_STOCK) {
            product.setStatus(ProductStatus.ACTIVE);
        }

        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse updateStatus(Long id, ProductStatus status) {
        if (status == null) {
            throw new BadRequestException("Status cannot be null");
        }
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", id));

        if (status == ProductStatus.ACTIVE
                && product.getStockQuantity() != null
                && product.getStockQuantity() == 0) {
            throw new BadRequestException(
                    "Cannot activate a product with zero stock. Add stock first.");
        }

        product.setStatus(status);
        product = productRepository.save(product);
        return mapToProductResponse(product);
    }

    @Override
    public PageResponse<ProductResponse> getInventory(String keyword, ProductStatus status, boolean lowStockOnly, Pageable pageable) {
        Page<Product> productPage = productRepository.findInventory(
                keyword == null || keyword.isBlank() ? null : keyword.trim(),
                status,
                lowStockOnly,
                10,
                pageable);
        return mapToPageResponse(productPage);
    }

    private PageResponse<ProductResponse> mapToPageResponse(Page<Product> productPage) {
        return PageResponse.<ProductResponse>builder()
                .content(productPage.getContent().stream().map(this::mapToProductResponse).toList())
                .pageNumber(productPage.getNumber())
                .pageSize(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .last(productPage.isLast())
                .build();
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
                .sku(product.getSku())
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
