import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import addressService from '../../services/addressService';

export const fetchAddresses = createAsyncThunk('address/fetchAddresses', async (_, { rejectWithValue }) => {
  try {
    const response = await addressService.getAddresses();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
  }
});

export const addAddress = createAsyncThunk('address/addAddress', async (data, { rejectWithValue }) => {
  try {
    const response = await addressService.addAddress(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add address');
  }
});

export const updateAddress = createAsyncThunk('address/updateAddress', async ({ id, data }, { rejectWithValue }) => {
  try {
    const response = await addressService.updateAddress(id, data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to update address');
  }
});

export const deleteAddress = createAsyncThunk('address/deleteAddress', async (id, { rejectWithValue }) => {
  try {
    await addressService.deleteAddress(id);
    return id;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
  }
});

export const setDefaultAddress = createAsyncThunk('address/setDefaultAddress', async (id, { rejectWithValue }) => {
  try {
    const response = await addressService.setDefaultAddress(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to set default address');
  }
});

const addressSlice = createSlice({
  name: 'address',
  initialState: {
    addresses: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAddressError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAddresses.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = action.payload.data || action.payload || [];
      })
      .addCase(fetchAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        state.loading = false;
        const newAddress = action.payload.data || action.payload;
        state.addresses.push(newAddress);
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.addresses.findIndex((a) => a.id === updated.id);
        if (index !== -1) {
          state.addresses[index] = updated;
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.addresses = state.addresses.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(setDefaultAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(setDefaultAddress.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        state.addresses = state.addresses.map((a) =>
          a.id === updated.id ? { ...a, isDefault: true } : { ...a, isDefault: false }
        );
      })
      .addCase(setDefaultAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAddressError } = addressSlice.actions;

export const selectAddresses = (state) => state.address.addresses;

export default addressSlice.reducer;
