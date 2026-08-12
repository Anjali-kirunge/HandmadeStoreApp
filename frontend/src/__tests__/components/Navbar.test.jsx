import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import Navbar from '../../components/layout/Navbar';
import ThemeProvider from '../../context/ThemeContext';
import authReducer from '../../redux/slices/authSlice';
import cartReducer from '../../redux/slices/cartSlice';
import wishlistReducer from '../../redux/slices/wishlistSlice';
import notificationsReducer from '../../redux/slices/notificationsSlice';

const createTestStore = (authState = {}) => configureStore({
  reducer: { auth: authReducer, cart: cartReducer, wishlist: wishlistReducer, notifications: notificationsReducer },
  preloadedState: { auth: { user: null, token: null, loading: false, error: null, isAuthenticated: false, ...authState } },
});

const renderNavbar = (authState) => render(
  <Provider store={createTestStore(authState)}>
    <BrowserRouter>
      <ThemeProvider><Navbar /></ThemeProvider>
    </BrowserRouter>
  </Provider>
);

describe('Navbar', () => {
  test('renders brand name', () => {
    renderNavbar();
    expect(screen.getByText(/Handmade/)).toBeInTheDocument();
  });
  test('shows login when not authenticated', () => {
    renderNavbar();
    expect(screen.getByText(/Login/)).toBeInTheDocument();
  });
});
