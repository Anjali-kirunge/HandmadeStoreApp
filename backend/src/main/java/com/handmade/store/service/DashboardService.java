package com.handmade.store.service;

import com.handmade.store.dto.dashboard.AdminDashboardResponse;
import com.handmade.store.dto.dashboard.SellerDashboardResponse;

public interface DashboardService {

    AdminDashboardResponse getAdminDashboard();

    SellerDashboardResponse getSellerDashboard(String sellerEmail);
}
