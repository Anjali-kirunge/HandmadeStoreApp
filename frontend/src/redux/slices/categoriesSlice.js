import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as categoryService from '../../services/categoryService';

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await categoryService.getCategories();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
  }
});

export const fetchRootCategories = createAsyncThunk('categories/fetchRootCategories', async (_, { rejectWithValue }) => {
  try {
    const response = await categoryService.getRootCategories();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch root categories');
  }
});

export const createCategory = createAsyncThunk('categories/createCategory', async (data, { rejectWithValue }) => {
  try {
    const response = await categoryService.createCategory(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create category');
  }
});

export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await categoryService.updateCategory(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update category');
  }
});

export const deleteCategory = createAsyncThunk('categories/deleteCategory', async (id, { rejectWithValue }) => {
  try {
    await categoryService.deleteCategory(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
  }
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCategoryError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data || action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRootCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRootCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data || action.payload;
      })
      .addCase(fetchRootCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        const newCategory = action.payload.data || action.payload;
        state.categories.push(newCategory);
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.categories.findIndex((c) => c.id === updated.id);
        if (index !== -1) {
          state.categories[index] = updated;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCategoryError } = categoriesSlice.actions;
export default categoriesSlice.reducer;
