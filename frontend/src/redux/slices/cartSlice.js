import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as cartService from '../../services/cartService';
import { applyCoupon as applyCouponApi } from '../../services/couponService';

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await cartService.getCart();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addToCart = createAsyncThunk('cart/addToCart', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const response = await cartService.addToCart({ productId, quantity });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/updateCartItem', async ({ productId, quantity }, { rejectWithValue }) => {
  try {
    const response = await cartService.updateCartItem(productId, quantity);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
  }
});

export const removeFromCart = createAsyncThunk('cart/removeFromCart', async (productId, { rejectWithValue }) => {
  try {
    await cartService.removeFromCart(productId);
    return productId;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
  }
});

export const clearCart = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await cartService.clearCart();
    return null;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async ({ code, orderTotal }, { rejectWithValue }) => {
  try {
    const response = await applyCouponApi({ code, orderTotal });
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to apply coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    totalPrice: 0,
    totalItems: 0,
    coupon: null,
    discount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearCartError: (state) => {
      state.error = null;
    },
    resetCoupon: (state) => {
      state.coupon = null;
      state.discount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || action.payload;
        state.items = data.items || data.cartItems || [];
        state.totalPrice = data.totalPrice || data.total || 0;
        state.totalItems = data.totalItems || data.items?.length || 0;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || action.payload;
        state.items = data.items || data.cartItems || state.items;
        state.totalPrice = data.totalPrice || data.total || state.totalPrice;
        state.totalItems = data.totalItems || state.items.length || 0;
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || action.payload;
        state.items = data.items || data.cartItems || state.items;
        state.totalPrice = data.totalPrice || data.total || state.totalPrice;
        state.totalItems = data.totalItems || state.items.length || 0;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(removeFromCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter((item) => {
          const itemId = item.productId || item.product?.id || item.id;
          return itemId !== action.payload;
        });
        state.totalItems = state.items.length;
        state.totalPrice = state.items.reduce((sum, item) => {
          return sum + (item.price || item.product?.price || 0) * (item.quantity || 1);
        }, 0);
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalPrice = 0;
        state.totalItems = 0;
        state.coupon = null;
        state.discount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(applyCoupon.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.loading = false;
        const data = action.payload.data || action.payload;
        state.coupon = data.coupon || data;
        state.discount = data.discount || data.discountAmount || 0;
      })
      .addCase(applyCoupon.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCartError, resetCoupon } = cartSlice.actions;

export const selectCartItemCount = (state) => state.cart.totalItems;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.totalPrice;

export default cartSlice.reducer;
