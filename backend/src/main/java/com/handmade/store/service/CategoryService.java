package com.handmade.store.service;

import com.handmade.store.dto.category.CategoryRequest;
import com.handmade.store.dto.category.CategoryResponse;

import java.util.List;
import java.util.Map;

public interface CategoryService {

    CategoryResponse create(CategoryRequest request);

    CategoryResponse update(Long id, CategoryRequest request);

    Map<String, Object> delete(Long id);

    CategoryResponse getById(Long id);

    List<CategoryResponse> getAll();

    List<CategoryResponse> getRootCategories();

    List<CategoryResponse> getByParentId(Long parentId);
}
