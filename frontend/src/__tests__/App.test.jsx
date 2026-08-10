import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { configureStore } from '@reduxjs/toolkit';
import App from '../App';
import authReducer from '../redux/slices/authSlice';
import cartReducer from '../redux/slices/cartSlice';
import productsReducer from '../redux/slices/productsSlice';
import wishlistReducer from '../redux/slices/wishlistSlice';
import ordersReducer from '../redux/slices/ordersSlice';
import userReducer from '../redux/slices/userSlice';
import categoriesReducer from '../redux/slices/categoriesSlice';
import reviewsReducer from '../redux/slices/reviewsSlice';
import couponsReducer from '../redux/slices/couponsSlice';
import notificationsReducer from '../redux/slices/notificationsSlice';
import adminReducer from '../redux/slices/adminSlice';
import sellerReducer from '../redux/slices/sellerSlice';
import addressReducer from '../redux/slices/addressSlice';

const createTestStore = () => configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: ordersReducer,
    user: userReducer,
    categories: categoriesReducer,
    reviews: reviewsReducer,
    coupons: couponsReducer,
    notifications: notificationsReducer,
    admin: adminReducer,
    seller: sellerReducer,
    address: addressReducer,
  },
});

const renderWithProviders = (ui) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        <HelmetProvider>{ui}</HelmetProvider>
      </BrowserRouter>
    </Provider>
  );
};

describe('App', () => {
  test('renders without crashing', () => {
    renderWithProviders(<App />);
  });
});
