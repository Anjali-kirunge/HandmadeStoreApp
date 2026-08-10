import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as reviewService from '../../services/reviewService';

export const fetchReviewsByProduct = createAsyncThunk('reviews/fetchReviewsByProduct', async ({ productId, page = 0, size = 10 }, { rejectWithValue }) => {
  try {
    const response = await reviewService.getReviewsByProduct(productId, { page, size });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch reviews');
  }
});

export const addReview = createAsyncThunk('reviews/addReview', async ({ productId, data }, { rejectWithValue }) => {
  try {
    const response = await reviewService.addReview(productId, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add review');
  }
});

export const updateReview = createAsyncThunk('reviews/updateReview', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await reviewService.updateReview(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update review');
  }
});

export const deleteReview = createAsyncThunk('reviews/deleteReview', async (id, { rejectWithValue }) => {
  try {
    await reviewService.deleteReview(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete review');
  }
});

export const canReview = createAsyncThunk('reviews/canReview', async (productId, { rejectWithValue }) => {
  try {
    const response = await reviewService.canReview(productId);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to check review eligibility');
  }
});

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState: {
    reviews: [],
    canReview: false,
    loading: false,
    error: null,
    totalPages: 0,
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviewsByProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewsByProduct.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload;
        state.reviews = data.content || data.data?.content || data;
        state.totalPages = data.totalPages || data.data?.totalPages || 0;
      })
      .addCase(fetchReviewsByProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addReview.fulfilled, (state, action) => {
        state.loading = false;
        const review = action.payload.data || action.payload;
        state.reviews.unshift(review);
      })
      .addCase(addReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.reviews.findIndex((r) => r.id === updated.id);
        if (index !== -1) {
          state.reviews[index] = updated;
        }
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = state.reviews.filter((r) => r.id !== action.payload);
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(canReview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(canReview.fulfilled, (state, action) => {
        state.loading = false;
        state.canReview = action.payload.canReview || action.payload.eligible || action.payload.data?.eligible || action.payload;
      })
      .addCase(canReview.rejected, (state) => {
        state.loading = false;
        state.canReview = false;
      });
  },
});

export const { clearReviewError } = reviewsSlice.actions;
export default reviewsSlice.reducer;
