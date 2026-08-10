import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as adminService from '../../services/adminService';
import * as userService from '../../services/userService';
import api from '../../services/api';

export const fetchAdminDashboard = createAsyncThunk('admin/fetchAdminDashboard', async (_, { rejectWithValue }) => {
  try {
    const response = await adminService.getDashboard();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard');
  }
});

export const fetchAllUsers = createAsyncThunk('admin/fetchAllUsers', async (params, { rejectWithValue }) => {
  try {
    const response = await userService.getAllUsers(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
  }
});

export const fetchAllOrders = createAsyncThunk('admin/fetchAllOrders', async (params, { rejectWithValue }) => {
  try {
    const response = await adminService.getAllOrders(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const updateOrderStatus = createAsyncThunk('admin/updateOrderStatus', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await adminService.updateOrderStatus(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
  }
});

export const fetchOrdersByStatus = createAsyncThunk('admin/fetchOrdersByStatus', async (status, { rejectWithValue }) => {
  try {
    const response = await adminService.getOrdersByStatus(status);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders by status');
  }
});

export const toggleUserEnabled = createAsyncThunk('admin/toggleUserEnabled', async (id, { rejectWithValue }) => {
  try {
    const response = await api.put(`/users/${id}/toggle`);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle user status');
  }
});

export const updateUserRole = createAsyncThunk('admin/updateUserRole', async ({ id, role }, { rejectWithValue }) => {
  try {
    const response = await api.put(`/users/${id}/role`, { role });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update user role');
  }
});

export const fetchAllReviews = createAsyncThunk('admin/fetchAllReviews', async (params, { rejectWithValue }) => {
  try {
    const response = await adminService.getAllReviews(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
  }
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    dashboard: null,
    users: [],
    orders: [],
    reviews: [],
    loading: false,
    error: null,
    totalPages: 0,
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload.data || action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAllUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllUsers.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.users = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
      })
      .addCase(fetchAllUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.orders = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.orders.findIndex((o) => o.id === updated.id);
        if (index !== -1) {
          state.orders[index] = updated;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrdersByStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload.data || action.payload;
      })
      .addCase(fetchOrdersByStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(toggleUserEnabled.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleUserEnabled.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.users.findIndex((u) => u.id === updated.id);
        if (index !== -1) {
          state.users[index] = updated;
        }
      })
      .addCase(toggleUserEnabled.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateUserRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.users.findIndex((u) => u.id === updated.id);
        if (index !== -1) {
          state.users[index] = updated;
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAllReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllReviews.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.reviews = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
      })
      .addCase(fetchAllReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
