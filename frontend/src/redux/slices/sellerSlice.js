import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as sellerService from '../../services/sellerService';

export const fetchSellerDashboard = createAsyncThunk('seller/fetchSellerDashboard', async (_, { rejectWithValue }) => {
  try {
    const response = await sellerService.getDashboard();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch seller dashboard');
  }
});

export const fetchSellerOrders = createAsyncThunk('seller/fetchSellerOrders', async (params, { rejectWithValue }) => {
  try {
    const response = await sellerService.getOrders(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch seller orders');
  }
});

export const updateSellerOrderStatus = createAsyncThunk('seller/updateSellerOrderStatus', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await sellerService.updateOrderStatus(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
  }
});

export const fetchSellerProducts = createAsyncThunk('seller/fetchSellerProducts', async (params, { rejectWithValue }) => {
  try {
    const response = await sellerService.getProducts(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch seller products');
  }
});

const sellerSlice = createSlice({
  name: 'seller',
  initialState: {
    dashboard: null,
    products: [],
    orders: [],
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 0,
  },
  reducers: {
    clearSellerError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerDashboard.fulfilled, (state, action) => {
        state.loading = false;
        state.dashboard = action.payload.data || action.payload;
      })
      .addCase(fetchSellerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.orders = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateSellerOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSellerOrderStatus.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.orders.findIndex((o) => o.id === updated.id);
        if (index !== -1) {
          state.orders[index] = updated;
        }
      })
      .addCase(updateSellerOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.products = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
        state.currentPage = data.pageNumber ?? data.number ?? data.data?.pageNumber ?? data.data?.number ?? 0;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSellerError } = sellerSlice.actions;
export default sellerSlice.reducer;
