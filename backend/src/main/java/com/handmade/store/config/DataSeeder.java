package com.handmade.store.config;

import com.handmade.store.entity.*;
import com.handmade.store.enums.ProductStatus;
import com.handmade.store.enums.Role;
import com.handmade.store.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Configuration
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder {

        @Bean
        CommandLineRunner seedData(UserRepository userRepository,
                        CategoryRepository categoryRepository,
                        ProductRepository productRepository,
                        CartRepository cartRepository,
                        ReviewRepository reviewRepository,
                        CouponRepository couponRepository,
                        PasswordEncoder passwordEncoder,
                        org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {

                return args -> {
                        try {
                                jdbcTemplate.execute("ALTER TABLE products MODIFY image_url TEXT");
                                jdbcTemplate.execute("ALTER TABLE product_images MODIFY image_url TEXT");
                        } catch (Exception e) {
                                log.warn("Could not alter image_url columns: " + e.getMessage());
                        }

                        if (userRepository.count() > 0) {
                                log.info("Database already seeded. Skipping...");
                                return;
                        }

                        try {
                                log.info("Seeding database...");

                                // ── Users ──────────────────────────────────────────────
                                log.info("Creating users...");

                                User admin = userRepository.save(User.builder()
                                                .firstName("Admin")
                                                .lastName("User")
                                                .email("admin@handmade.com")
                                                .password(passwordEncoder.encode("admin123"))
                                                .phone("9999900000")
                                                .role(Role.ROLE_ADMIN)
                                                .enabled(true)
                                                .build());

                                User seller1 = userRepository.save(User.builder()
                                                .firstName("Priya")
                                                .lastName("Sharma")
                                                .email("seller1@handmade.com")
                                                .password(passwordEncoder.encode("seller123"))
                                                .phone("9999911111")
                                                .role(Role.ROLE_SELLER)
                                                .enabled(true)
                                                .build());

                                User seller2 = userRepository.save(User.builder()
                                                .firstName("Rahul")
                                                .lastName("Verma")
                                                .email("seller2@handmade.com")
                                                .password(passwordEncoder.encode("seller123"))
                                                .phone("9999922222")
                                                .role(Role.ROLE_SELLER)
                                                .enabled(true)
                                                .build());

                                User customer1 = userRepository.save(User.builder()
                                                .firstName("Anita")
                                                .lastName("Patel")
                                                .email("customer1@handmade.com")
                                                .password(passwordEncoder.encode("customer123"))
                                                .phone("9999933333")
                                                .role(Role.ROLE_CUSTOMER)
                                                .enabled(true)
                                                .build());

                                User customer2 = userRepository.save(User.builder()
                                                .firstName("Vikram")
                                                .lastName("Singh")
                                                .email("customer2@handmade.com")
                                                .password(passwordEncoder.encode("customer123"))
                                                .phone("9999944444")
                                                .role(Role.ROLE_CUSTOMER)
                                                .enabled(true)
                                                .build());

                                // ── Categories ──────────────────────────────────────────
                                log.info("Creating categories...");

                                Category handbags = categoryRepository.save(Category.builder()
                                                .name("Handbags")
                                                .description("Handcrafted bags and purses made with love")
                                                .imageUrl("https://placehold.co/600x400/8B4513/FFFFFF?text=Handbags")
                                                .build());

                                Category pots = categoryRepository.save(Category.builder()
                                                .name("Pots")
                                                .description("Beautiful handmade pots and planters")
                                                .imageUrl("https://placehold.co/600x400/228B22/FFFFFF?text=Pots")
                                                .build());

                                Category decor = categoryRepository.save(Category.builder()
                                                .name("Decor")
                                                .description("Unique home decor items for every room")
                                                .imageUrl("https://placehold.co/600x400/4169E1/FFFFFF?text=Decor")
                                                .build());

                                Category jewelry = categoryRepository.save(Category.builder()
                                                .name("Jewelry")
                                                .description("Handmade jewelry pieces crafted with care")
                                                .imageUrl("https://placehold.co/600x400/DAA520/FFFFFF?text=Jewelry")
                                                .build());

                                Category paintings = categoryRepository.save(Category.builder()
                                                .name("Paintings")
                                                .description("Original artwork and paintings by local artists")
                                                .imageUrl("https://placehold.co/600x400/DC143C/FFFFFF?text=Paintings")
                                                .build());

                                Category woodCraft = categoryRepository.save(Category.builder()
                                                .name("Wood Craft")
                                                .description("Hand-carved wooden items and sculptures")
                                                .imageUrl("https://placehold.co/600x400/8B4513/FFFFFF?text=Wood+Craft")
                                                .build());

                                // ── Products ────────────────────────────────────────────
                                log.info("Creating products...");

                                // Handbags (2)
                                Product p1 = productRepository.save(Product.builder()
                                                .name("Leather Tote Bag")
                                                .description("Premium hand-stitched leather tote bag with elegant finish. Perfect for everyday use with spacious interior and sturdy handles.")
                                                .price(new BigDecimal("699"))
                                                .discountPrice(new BigDecimal("549"))
                                                .sku("HB-001")
                                                .stockQuantity(25)
                                                .category(handbags)
                                                .seller(seller1)
                                                .rating(4.5)
                                                .reviewCount(12)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(true)
                                                .imageUrl("https://placehold.co/600x400/8B4513/FFFFFF?text=Leather+Tote+Bag")
                                                .images(Set.of("https://placehold.co/600x400/8B4513/FFFFFF?text=Leather+Tote+Bag"))
                                                .build());

                                Product p2 = productRepository.save(Product.builder()
                                                .name("Embroidered Clutch")
                                                .description("Beautiful hand-embroidered clutch with mirror work. Ideal for festive occasions and parties.")
                                                .price(new BigDecimal("450"))
                                                .discountPrice(new BigDecimal("350"))
                                                .sku("HB-002")
                                                .stockQuantity(40)
                                                .category(handbags)
                                                .seller(seller1)
                                                .rating(4.2)
                                                .reviewCount(8)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(false)
                                                .imageUrl("https://placehold.co/600x400/FF69B4/FFFFFF?text=Embroidered+Clutch")
                                                .images(Set.of("https://placehold.co/600x400/FF69B4/FFFFFF?text=Embroidered+Clutch"))
                                                .build());

                                // Pots (2)
                                Product p3 = productRepository.save(Product.builder()
                                                .name("Terracotta Planter Set")
                                                .description("Set of 3 handcrafted terracotta planters in rustic finish. Perfect for indoor plants and balcony gardens.")
                                                .price(new BigDecimal("599"))
                                                .discountPrice(new BigDecimal("479"))
                                                .sku("PT-001")
                                                .stockQuantity(30)
                                                .category(pots)
                                                .seller(seller2)
                                                .rating(4.7)
                                                .reviewCount(15)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(true)
                                                .imageUrl("https://placehold.co/600x400/CD853F/FFFFFF?text=Terracotta+Planters")
                                                .images(Set.of("https://placehold.co/600x400/CD853F/FFFFFF?text=Terracotta+Planters"))
                                                .build());

                                Product p4 = productRepository.save(Product.builder()
                                                .name("Ceramic Flower Pot")
                                                .description("Elegant ceramic flower pot with hand-painted design. Drainage hole included for healthy plant growth.")
                                                .price(new BigDecimal("399"))
                                                .discountPrice(null)
                                                .sku("PT-002")
                                                .stockQuantity(50)
                                                .category(pots)
                                                .seller(seller2)
                                                .rating(4.0)
                                                .reviewCount(6)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(false)
                                                .imageUrl("https://placehold.co/600x400/CD853F/FFFFFF?text=Ceramic+Flower+Pot")
                                                .images(Set.of("https://placehold.co/600x400/CD853F/FFFFFF?text=Ceramic+Flower+Pot"))
                                                .build());

                                // Decor (2)
                                Product p5 = productRepository.save(Product.builder()
                                                .name("Macrame Wall Hanging")
                                                .description("Intricately knotted macrame wall hanging made from natural cotton rope. Adds boho charm to any room.")
                                                .price(new BigDecimal("750"))
                                                .discountPrice(new BigDecimal("599"))
                                                .sku("DC-001")
                                                .stockQuantity(20)
                                                .category(decor)
                                                .seller(seller1)
                                                .rating(4.8)
                                                .reviewCount(22)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(true)
                                                .imageUrl("https://placehold.co/600x400/DEB887/000000?text=Macrame+Wall+Hanging")
                                                .images(Set.of("https://placehold.co/600x400/DEB887/000000?text=Macrame+Wall+Hanging"))
                                                .build());

                                Product p6 = productRepository.save(Product.builder()
                                                .name("Hand-painted Vase")
                                                .description("Colorful hand-painted clay vase with traditional motifs. A stunning centerpiece for your living room.")
                                                .price(new BigDecimal("550"))
                                                .discountPrice(new BigDecimal("440"))
                                                .sku("DC-002")
                                                .stockQuantity(35)
                                                .category(decor)
                                                .seller(seller2)
                                                .rating(4.3)
                                                .reviewCount(10)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(false)
                                                .imageUrl("https://placehold.co/600x400/20B2AA/FFFFFF?text=Painted+Vase")
                                                .images(Set.of("https://placehold.co/600x400/20B2AA/FFFFFF?text=Painted+Vase"))
                                                .build());

                                // Jewelry (2)
                                Product p7 = productRepository.save(Product.builder()
                                                .name("Kundan Necklace Set")
                                                .description("Traditional Kundan necklace set with matching earrings. Beautifully crafted with faux gemstones and gold plating.")
                                                .price(new BigDecimal("699"))
                                                .discountPrice(new BigDecimal("525"))
                                                .sku("JW-001")
                                                .stockQuantity(15)
                                                .category(jewelry)
                                                .seller(seller1)
                                                .rating(4.6)
                                                .reviewCount(18)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(true)
                                                .imageUrl("https://placehold.co/600x400/FFD700/000000?text=Kundan+Necklace")
                                                .images(Set.of("https://placehold.co/600x400/FFD700/000000?text=Kundan+Necklace"))
                                                .build());

                                Product p8 = productRepository.save(Product.builder()
                                                .name("Silver Jhumka Earrings")
                                                .description("Oxidized silver jhumka earrings with intricate filigree work. Lightweight and comfortable for all-day wear.")
                                                .price(new BigDecimal("350"))
                                                .discountPrice(null)
                                                .sku("JW-002")
                                                .stockQuantity(60)
                                                .category(jewelry)
                                                .seller(seller2)
                                                .rating(4.4)
                                                .reviewCount(25)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(false)
                                                .imageUrl("https://placehold.co/600x400/C0C0C0/000000?text=Jhumka+Earrings")
                                                .images(Set.of("https://placehold.co/600x400/C0C0C0/000000?text=Jhumka+Earrings"))
                                                .build());

                                // Paintings (2)
                                Product p9 = productRepository.save(Product.builder()
                                                .name("Madhubani Art Canvas")
                                                .description("Authentic Madhubani painting on canvas depicting nature themes. Hand-painted by traditional artists from Bihar.")
                                                .price(new BigDecimal("650"))
                                                .discountPrice(new BigDecimal("499"))
                                                .sku("PA-001")
                                                .stockQuantity(10)
                                                .category(paintings)
                                                .seller(seller1)
                                                .rating(4.9)
                                                .reviewCount(30)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(true)
                                                .imageUrl("https://placehold.co/600x400/FF6347/FFFFFF?text=Madhubani+Art")
                                                .images(Set.of("https://placehold.co/600x400/FF6347/FFFFFF?text=Madhubani+Art"))
                                                .build());

                                Product p10 = productRepository.save(Product.builder()
                                                .name("Abstract Watercolor Set")
                                                .description("Set of 3 abstract watercolor paintings on premium paper. Modern art pieces perfect for office or home walls.")
                                                .price(new BigDecimal("480"))
                                                .discountPrice(new BigDecimal("380"))
                                                .sku("PA-002")
                                                .stockQuantity(18)
                                                .category(paintings)
                                                .seller(seller2)
                                                .rating(4.1)
                                                .reviewCount(7)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(false)
                                                .imageUrl("https://placehold.co/600x400/6495ED/FFFFFF?text=Watercolor+Set")
                                                .images(Set.of("https://placehold.co/600x400/6495ED/FFFFFF?text=Watercolor+Set"))
                                                .build());

                                // Wood Craft (2)
                                Product p11 = productRepository.save(Product.builder()
                                                .name("Wooden Elephant Statue")
                                                .description("Hand-carved wooden elephant statue from sheesham wood. A beautiful showpiece that showcases Indian craftsmanship.")
                                                .price(new BigDecimal("580"))
                                                .discountPrice(new BigDecimal("450"))
                                                .sku("WC-001")
                                                .stockQuantity(22)
                                                .category(woodCraft)
                                                .seller(seller1)
                                                .rating(4.5)
                                                .reviewCount(14)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(true)
                                                .imageUrl("https://placehold.co/600x400/8B4513/FFFFFF?text=Elephant+Statue")
                                                .images(Set.of("https://placehold.co/600x400/8B4513/FFFFFF?text=Elephant+Statue"))
                                                .build());

                                Product p12 = productRepository.save(Product.builder()
                                                .name("Wooden Key Holder")
                                                .description("Rustic wooden key holder with hand-carved hooks. Functional art for your entrance hallway.")
                                                .price(new BigDecimal("320"))
                                                .discountPrice(null)
                                                .sku("WC-002")
                                                .stockQuantity(45)
                                                .category(woodCraft)
                                                .seller(seller2)
                                                .rating(4.2)
                                                .reviewCount(9)
                                                .status(ProductStatus.ACTIVE)
                                                .isFeatured(false)
                                                .imageUrl("https://placehold.co/600x400/A0522D/FFFFFF?text=Key+Holder")
                                                .images(Set.of("https://placehold.co/600x400/A0522D/FFFFFF?text=Key+Holder"))
                                                .build());

                                // ── Carts ───────────────────────────────────────────────
                                log.info("Creating carts...");

                                List<User> allUsers = List.of(admin, seller1, seller2, customer1, customer2);
                                for (User user : allUsers) {
                                        cartRepository.save(Cart.builder().user(user).build());
                                }

                                // ── Reviews ────────────────────────────────────────────
                                log.info("Creating sample reviews...");

                                reviewRepository.save(Review.builder()
                                                .user(customer1)
                                                .product(p1)
                                                .rating(5)
                                                .comment("Absolutely love this bag! The leather quality is superb and the stitching is perfect.")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer2)
                                                .product(p1)
                                                .rating(4)
                                                .comment("Great bag for the price. Could use one more inner pocket.")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer1)
                                                .product(p3)
                                                .rating(5)
                                                .comment("These planters are beautiful! They look even better in person.")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer2)
                                                .product(p5)
                                                .rating(5)
                                                .comment("This macrame piece transformed my living room wall. Stunning craftsmanship!")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer1)
                                                .product(p7)
                                                .rating(4)
                                                .comment("Very pretty necklace set. Looks great with ethnic outfits.")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer2)
                                                .product(p9)
                                                .rating(5)
                                                .comment("The Madhubani painting is truly authentic and vibrant. A masterpiece!")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer1)
                                                .product(p11)
                                                .rating(4)
                                                .comment("Exquisite wooden elephant. The detailing is remarkable for the price.")
                                                .build());

                                reviewRepository.save(Review.builder()
                                                .user(customer2)
                                                .product(p3)
                                                .rating(5)
                                                .comment("Perfect planters for my balcony garden. Drainage works great.")
                                                .build());

                                // ── Coupons ─────────────────────────────────────────────
                                log.info("Creating coupons...");

                                couponRepository.save(Coupon.builder()
                                                .code("WELCOME10")
                                                .discountPercentage(new BigDecimal("10"))
                                                .maxDiscount(new BigDecimal("200"))
                                                .minPurchase(new BigDecimal("500"))
                                                .usageLimit(100)
                                                .usedCount(0)
                                                .validFrom(LocalDateTime.now().minusDays(30))
                                                .validUntil(LocalDateTime.now().plusDays(90))
                                                .active(true)
                                                .build());

                                couponRepository.save(Coupon.builder()
                                                .code("FLAT200")
                                                .discountPercentage(new BigDecimal("20"))
                                                .maxDiscount(new BigDecimal("200"))
                                                .minPurchase(new BigDecimal("1000"))
                                                .usageLimit(50)
                                                .usedCount(0)
                                                .validFrom(LocalDateTime.now().minusDays(15))
                                                .validUntil(LocalDateTime.now().plusDays(60))
                                                .active(true)
                                                .build());

                                log.info("Database seeding completed successfully!");

                        } catch (Exception e) {
                                log.error("Database seeding failed: {}", e.getMessage(), e);
                                log.warn("Application will continue to start without seeded data.");
                        }
                };
        }
}
