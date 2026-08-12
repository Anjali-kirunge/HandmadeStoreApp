import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';
import api, { clearAuthState, setAuthToken } from '../../services/api';

const persistAuth = (token, refreshToken, user) => {
  if (token) {
    localStorage.setItem('token', token);
    setAuthToken(token);
  }
  if (refreshToken) {
    localStorage.setItem('refresh_token', refreshToken);
  }
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const loginUser = createAsyncThunk('auth/loginUser', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.login(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.register(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Registration failed');
  }
});

export const verifyRegistrationOtp = createAsyncThunk(
  'auth/verifyRegistrationOtp',
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.verifyRegistrationOtp(data.email, data.otp);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'OTP verification failed');
    }
  }
);

export const resendRegistrationOtp = createAsyncThunk(
  'auth/resendRegistrationOtp',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.resendRegistrationOtp(email);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to resend OTP');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { rejectWithValue }) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await authService.logout(token);
      } catch (_ignored) {
        // Server-side revocation is best-effort; local logout must still proceed.
      }
    }
    return null;
  } catch (error) {
    return rejectWithValue(error.message || 'Logout failed');
  }
});

export const forgotPassword = createAsyncThunk('auth/forgotPassword', async (email, { rejectWithValue }) => {
  try {
    const response = await authService.forgotPassword(email);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Forgot password failed');
  }
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.resetPassword(data);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Reset password failed');
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to load user');
  }
});

export const refreshToken = createAsyncThunk('auth/refreshToken', async (_, { rejectWithValue }) => {
  try {
    const refreshToken = localStorage.getItem('refresh_token');
    const response = await authService.refreshToken(refreshToken);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Token refresh failed');
  }
});

const savedUser = localStorage.getItem('user');
const initialUser = savedUser ? JSON.parse(savedUser) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
    isAuthenticated: !!initialUser,
    pendingVerificationEmail: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    setPendingVerificationEmail: (state, action) => {
      state.pendingVerificationEmail = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data?.user;
        state.token = action.payload.token || action.payload.data?.token;
        state.isAuthenticated = true;
        persistAuth(
          action.payload.token || action.payload.data?.token,
          action.payload.refreshToken || action.payload.data?.refreshToken,
          action.payload.user || action.payload.data?.user
        );
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        const token = action.payload.token || action.payload.data?.token;
        if (token) {
          state.user = action.payload.user || action.payload.data?.user;
          state.token = token;
          state.isAuthenticated = true;
          persistAuth(token, action.payload.refreshToken || action.payload.data?.refreshToken, action.payload.user || action.payload.data?.user);
        } else {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          state.pendingVerificationEmail = action.payload.user?.email || null;
        }
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(verifyRegistrationOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyRegistrationOtp.fulfilled, (state) => {
        state.loading = false;
        state.pendingVerificationEmail = null;
      })
      .addCase(verifyRegistrationOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resendRegistrationOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resendRegistrationOtp.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resendRegistrationOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        state.pendingVerificationEmail = null;
        clearAuthState();
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
        clearAuthState();
      })

      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(loadUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data;
        state.isAuthenticated = true;
        localStorage.setItem('user', JSON.stringify(state.user));
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload;
      })

      .addCase(refreshToken.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.loading = false;
        const token = action.payload.token || action.payload.data?.token;
        const refresh = action.payload.refreshToken || action.payload.data?.refreshToken;
        state.token = token;
        persistAuth(token, refresh);
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, setPendingVerificationEmail } = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;
export const selectToken = (state) => state.auth.token;
export const selectPendingVerificationEmail = (state) => state.auth.pendingVerificationEmail;

export default authSlice.reducer;
