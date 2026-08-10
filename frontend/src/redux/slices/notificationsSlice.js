import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as notificationService from '../../services/notificationService';

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.getNotifications();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
  }
});

export const markAsRead = createAsyncThunk('notifications/markAsRead', async (id, { rejectWithValue }) => {
  try {
    const response = await notificationService.markAsRead(id);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
  }
});

export const markAllAsRead = createAsyncThunk('notifications/markAllAsRead', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.markAllAsRead();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to mark all as read');
  }
});

export const getUnreadCount = createAsyncThunk('notifications/getUnreadCount', async (_, { rejectWithValue }) => {
  try {
    const response = await notificationService.getUnreadCount();
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch unread count');
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  reducers: {
    clearNotificationError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.data || action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(markAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload.data || action.payload;
        const index = state.notifications.findIndex((n) => n.id === updated.id);
        if (index !== -1) {
          state.notifications[index] = updated;
        }
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(markAllAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.loading = false;
        state.notifications = state.notifications.map((n) => ({ ...n, read: true }));
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(getUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload.count || action.payload.data?.count || action.payload || 0;
      });
  },
});

export const { clearNotificationError } = notificationsSlice.actions;
export default notificationsSlice.reducer;
