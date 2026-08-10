package com.handmade.store.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
public class SwaggerConfig {

    private static final String BEARER_TOKEN = "Bearer Token";

    @Bean
    public OpenAPI handmadeStoreOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Handmade Store API")
                        .version("1.0.0")
                        .description("E-Commerce REST API for Handmade Store")
                        .contact(new Contact()
                                .name("Handmade Store Team")
                                .email("support@handmadestore.com")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_TOKEN))
                .components(new Components()
                        .addSecuritySchemes(BEARER_TOKEN, new SecurityScheme()
                                .name(BEARER_TOKEN)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .tags(List.of(
                        new Tag().name("Authentication").description("Auth endpoints"),
                        new Tag().name("Products").description("Product management"),
                        new Tag().name("Categories").description("Category management"),
                        new Tag().name("Reviews").description("Product reviews"),
                        new Tag().name("Orders").description("Order management"),
                        new Tag().name("Users").description("User management"),
                        new Tag().name("Admin").description("Admin operations"),
                        new Tag().name("Seller").description("Seller operations")));
    }
}
