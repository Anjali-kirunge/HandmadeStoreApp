package com.handmade.store.service.impl;

import com.handmade.store.dto.category.CategoryRequest;
import com.handmade.store.dto.category.CategoryResponse;
import com.handmade.store.entity.Category;
import com.handmade.store.exception.BadRequestException;
import com.handmade.store.exception.ResourceNotFoundException;
import com.handmade.store.repository.CategoryRepository;
import com.handmade.store.service.CategoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new BadRequestException("Category with name '" + request.getName() + "' already exists");
        }

        Category category = Category.builder()
                .name(request.getName())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .build();

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", "id", request.getParentId()));
            category.setParent(parent);
        }

        category = categoryRepository.save(category);
        return mapToCategoryResponse(category);
    }

    @Override
    @Transactional
    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));

        if (request.getName() != null) {
            category.setName(request.getName());
        }
        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        if (request.getImageUrl() != null) {
            category.setImageUrl(request.getImageUrl());
        }
        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new BadRequestException("A category cannot be its own parent");
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category", "id", request.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        category = categoryRepository.save(category);
        return mapToCategoryResponse(category);
    }

    @Override
    @Transactional
    public Map<String, Object> delete(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        categoryRepository.delete(category);

        Map<String, Object> result = new HashMap<>();
        result.put("message", "Category deleted successfully");
        return result;
    }

    @Override
    public CategoryResponse getById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", id));
        return mapToCategoryResponse(category);
    }

    @Override
    public List<CategoryResponse> getAll() {
        List<Category> all = categoryRepository.findAll();
        Map<Long, List<Category>> childrenByParent = new HashMap<>();
        for (Category category : all) {
            if (category.getParent() != null && category.getParent().getId() != null) {
                childrenByParent.computeIfAbsent(category.getParent().getId(), k -> new ArrayList<>()).add(category);
            }
        }
        return all.stream()
                .filter(category -> category.getParent() == null)
                .map(category -> mapToCategoryResponseWithChildren(category, childrenByParent))
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getRootCategories() {
        List<Category> rootCategories = categoryRepository.findByParentId(null);
        return rootCategories.stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryResponse> getByParentId(Long parentId) {
        List<Category> categories = categoryRepository.findByParentId(parentId);
        return categories.stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .imageUrl(category.getImageUrl())
                .parentCategory(category.getParent() != null ? category.getParent().getId() : null)
                .children(new ArrayList<>())
                .createdAt(category.getCreatedAt())
                .build();
    }

    private CategoryResponse mapToCategoryResponseWithChildren(Category category,
                                                               Map<Long, List<Category>> childrenByParent) {
        CategoryResponse response = mapToCategoryResponse(category);
        List<CategoryResponse> children = childrenByParent
                .getOrDefault(category.getId(), new ArrayList<>()).stream()
                .map(child -> mapToCategoryResponseWithChildren(child, childrenByParent))
                .collect(Collectors.toList());
        response.setChildren(children);
        return response;
    }
}
