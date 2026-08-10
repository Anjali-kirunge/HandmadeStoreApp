import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as couponService from '../../services/couponService';

export const fetchCoupons = createAsyncThunk('coupons/fetchCoupons', async (_, { rejectWithValue }) => {
  try {
    const response = await couponService.getCoupons();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch coupons');
  }
});

export const createCoupon = createAsyncThunk('coupons/createCoupon', async (data, { rejectWithValue }) => {
  try {
    const response = await couponService.createCoupon(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create coupon');
  }
});

export const updateCoupon = createAsyncThunk('coupons/updateCoupon', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await couponService.updateCoupon(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update coupon');
  }
});

export const deleteCoupon = createAsyncThunk('coupons/deleteCoupon', async (id, { rejectWithValue }) => {
  try {
    await couponService.deleteCoupon(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete coupon');
  }
});

const couponsSlice = createSlice({
  name: 'coupons',
  initialState: {
    coupons: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCouponError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data || action.payload;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const coupon = action.payload.data || action.payload;
        state.coupons.push(coupon);
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.coupons.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
          state.coupons[index] = updated;
        }
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = state.coupons.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCouponError } = couponsSlice.actions;
export default couponsSlice.reducer;
