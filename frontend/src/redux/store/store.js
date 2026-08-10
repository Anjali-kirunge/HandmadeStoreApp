import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../slices/authSlice';
import productsReducer from '../slices/productsSlice';
import cartReducer from '../slices/cartSlice';
import wishlistReducer from '../slices/wishlistSlice';
import ordersReducer from '../slices/ordersSlice';
import userReducer from '../slices/userSlice';
import categoriesReducer from '../slices/categoriesSlice';
import reviewsReducer from '../slices/reviewsSlice';
import couponsReducer from '../slices/couponsSlice';
import notificationsReducer from '../slices/notificationsSlice';
import adminReducer from '../slices/adminSlice';
import sellerReducer from '../slices/sellerSlice';
import addressReducer from '../slices/addressSlice';

const store = configureStore({
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

export default store;
