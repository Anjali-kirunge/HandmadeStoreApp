import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as productService from '../../services/productService';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async (params, { rejectWithValue }) => {
  try {
    const response = await productService.searchProducts(params);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
  }
});

export const fetchProductById = createAsyncThunk('products/fetchProductById', async (id, { rejectWithValue }) => {
  try {
    const response = await productService.getProductById(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch product');
  }
});

export const fetchFeaturedProducts = createAsyncThunk('products/fetchFeaturedProducts', async (page, { rejectWithValue }) => {
  try {
    const response = await productService.getFeaturedProducts(page);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch featured products');
  }
});

export const createProduct = createAsyncThunk('products/createProduct', async (data, { rejectWithValue }) => {
  try {
    const response = await productService.createProduct(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to create product');
  }
});

export const updateProduct = createAsyncThunk('products/updateProduct', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await productService.updateProduct(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update product');
  }
});

export const deleteProduct = createAsyncThunk('products/deleteProduct', async (id, { rejectWithValue }) => {
  try {
    await productService.deleteProduct(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete product');
  }
});

export const updateStock = createAsyncThunk('products/updateStock', async ({ id, quantity }, { rejectWithValue }) => {
  try {
    const response = await productService.updateStock(id, quantity);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update stock');
  }
});

export const toggleFeatured = createAsyncThunk('products/toggleFeatured', async (id, { rejectWithValue }) => {
  try {
    const response = await productService.toggleFeatured(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to toggle featured');
  }
});

export const fetchProductsByCategory = createAsyncThunk('products/fetchProductsByCategory', async ({ categoryId, page = 0, size = 8 }, { rejectWithValue }) => {
  try {
    const response = await productService.searchProducts({ categoryId, page, size });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch products by category');
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    products: [],
    product: null,
    featuredProducts: [],
    loading: false,
    error: null,
    totalPages: 0,
    currentPage: 0,
    totalElements: 0,
  },
  reducers: {
    clearProductError: (state) => {
      state.error = null;
    },
    clearCurrentProduct: (state) => {
      state.product = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content || action.payload.data?.content || action.payload;
        state.totalPages = action.payload.totalPages || action.payload.data?.totalPages || 0;
        state.currentPage = action.payload.pageNumber ?? action.payload.number ?? action.payload.data?.pageNumber ?? action.payload.data?.number ?? 0;
        state.totalElements = action.payload.totalElements || action.payload.data?.totalElements || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loading = false;
        state.product = action.payload.data || action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFeaturedProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredProducts = action.payload.content || action.payload.data?.content || action.payload;
      })
      .addCase(fetchFeaturedProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        const newProduct = action.payload.data || action.payload;
        state.products.push(newProduct);
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.products.findIndex((p) => p.id === updated.id);
        if (index !== -1) {
          state.products[index] = updated;
        }
        if (state.product && state.product.id === updated.id) {
          state.product = updated;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.products.findIndex((p) => p.id === updated.id);
        if (index !== -1) {
          state.products[index] = updated;
        }
        if (state.product && state.product.id === updated.id) {
          state.product = updated;
        }
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(toggleFeatured.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleFeatured.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.products.findIndex((p) => p.id === updated.id);
        if (index !== -1) {
          state.products[index] = updated;
        }
      })
      .addCase(toggleFeatured.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchProductsByCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductsByCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.content || action.payload.data?.content || action.payload;
        state.totalPages = action.payload.totalPages || action.payload.data?.totalPages || 0;
        state.currentPage = action.payload.pageNumber ?? action.payload.number ?? action.payload.data?.pageNumber ?? action.payload.data?.number ?? 0;
        state.totalElements = action.payload.totalElements || action.payload.data?.totalElements || 0;
      })
      .addCase(fetchProductsByCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProductError, clearCurrentProduct } = productsSlice.actions;
export default productsSlice.reducer;
