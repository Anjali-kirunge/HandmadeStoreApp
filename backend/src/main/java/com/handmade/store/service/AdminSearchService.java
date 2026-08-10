package com.handmade.store.service;

import com.handmade.store.dto.search.GlobalSearchResponse;

public interface AdminSearchService {
    GlobalSearchResponse globalSearch(String keyword, int limit);
}
