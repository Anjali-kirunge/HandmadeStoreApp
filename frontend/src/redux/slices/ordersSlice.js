import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as orderService from '../../services/orderService';

export const placeOrder = createAsyncThunk('orders/placeOrder', async (data, { rejectWithValue }) => {
  try {
    const response = await orderService.placeOrder(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to place order');
  }
});

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async (params, { rejectWithValue }) => {
  try {
    const response = await orderService.getOrders(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (id, { rejectWithValue }) => {
  try {
    const response = await orderService.getOrderById(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
  }
});

export const cancelOrder = createAsyncThunk('orders/cancelOrder', async (id, { rejectWithValue }) => {
  try {
    const response = await orderService.cancelOrder(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
  }
});

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {
    orders: [],
    currentOrder: null,
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 0,
    totalElements: 0,
  },
  reducers: {
    clearOrderError: (state) => {
      state.error = null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.loading = false;
        const order = action.payload.data || action.payload;
        state.currentOrder = order;
        state.orders.unshift(order);
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.orders = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
        state.currentPage = data.pageNumber ?? data.number ?? data.data?.pageNumber ?? data.data?.number ?? 0;
        state.totalElements = data.totalElements || data.data?.totalElements || 0;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload.data || action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        const cancelled = action.payload.data || action.payload;
        const index = state.orders.findIndex((o) => o.id === cancelled.id);
        if (index !== -1) {
          state.orders[index] = cancelled;
        }
        if (state.currentOrder && state.currentOrder.id === cancelled.id) {
          state.currentOrder = cancelled;
        }
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOrderError, clearCurrentOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
