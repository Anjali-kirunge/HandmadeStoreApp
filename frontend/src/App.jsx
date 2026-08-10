import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ThemeProvider from './context/ThemeContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import SellerLayout from './components/layout/SellerLayout';
import ProtectedRoute, { RoleBasedRoute } from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import ErrorBoundary from './components/common/ErrorBoundary';

const HomePage = lazy(() => import('./pages/customer/HomePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const RegisterOtpPage = lazy(() => import('./pages/auth/RegisterOtpPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const ShopPage = lazy(() => import('./pages/customer/ShopPage'));
const ProductDetailPage = lazy(() => import('./pages/customer/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('./pages/customer/CheckoutPage'));
const OrderHistoryPage = lazy(() => import('./pages/customer/OrderHistoryPage'));
const OrderDetailPage = lazy(() => import('./pages/customer/OrderDetailPage'));
const WishlistPage = lazy(() => import('./pages/customer/WishlistPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const NotificationsPage = lazy(() => import('./pages/customer/NotificationsPage'));
const AboutPage = lazy(() => import('./pages/customer/AboutPage'));
const TermsPage = lazy(() => import('./pages/customer/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/customer/PrivacyPage'));
const SellerDashboard = lazy(() => import('./pages/seller/SellerDashboard'));
const SellerProducts = lazy(() => import('./pages/seller/SellerProducts'));
const AddProduct = lazy(() => import('./pages/seller/AddProduct'));
const EditProduct = lazy(() => import('./pages/seller/EditProduct'));
const SellerOrders = lazy(() => import('./pages/seller/SellerOrders'));
const SellerEarnings = lazy(() => import('./pages/seller/SellerEarnings'));
const AdminLayout = lazy(() => import('./admin/components/layout/AdminLayout'));
const AdminLogin = lazy(() => import('./admin/pages/Login'));
const AdminDashboard = lazy(() => import('./admin/pages/Dashboard'));
const AdminProducts = lazy(() => import('./admin/pages/Products'));
const AdminProductForm = lazy(() => import('./admin/pages/ProductForm'));
const AdminCategories = lazy(() => import('./admin/pages/Categories'));
const AdminUsers = lazy(() => import('./admin/pages/Users'));
const AdminUserDetail = lazy(() => import('./admin/pages/UserDetail'));
const AdminOrders = lazy(() => import('./admin/pages/Orders'));
const AdminOrderDetail = lazy(() => import('./admin/pages/OrderDetail'));
const AdminPayments = lazy(() => import('./admin/pages/Payments'));
const AdminCoupons = lazy(() => import('./admin/pages/Coupons'));
const AdminReviews = lazy(() => import('./admin/pages/Reviews'));
const AdminInventory = lazy(() => import('./admin/pages/Inventory'));
const AdminAnalytics = lazy(() => import('./admin/pages/Analytics'));
const AdminReports = lazy(() => import('./admin/pages/Reports'));
const NotFoundPage = lazy(() => import('./pages/common/NotFoundPage'));

// Import AdminProtectedRoute
import AdminProtectedRoute from './admin/components/ProtectedRoute';

// Import WelcomeAnimation
import WelcomeAnimation from './components/common/WelcomeAnimation';

const SELLER_ROLES = ['ROLE_SELLER'];

const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
    <LoadingSpinner fullPage={false} />
  </div>
);

const SuspenseWrapper = ({ children }) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

const CustomerLayout = ({ children }) => (
  <div className="d-flex flex-column min-vh-100">
    <Navbar />
    <main className="flex-grow-1"><SuspenseWrapper>{children}</SuspenseWrapper></main>
    <Footer />
  </div>
);

import ScrollToTop from './components/common/ScrollToTop';
import ChatWidget from './components/chat/ChatWidget';

function App() {
  return (
    <ThemeProvider>
      <ScrollToTop />
      <WelcomeAnimation />
      <Helmet>
        <title>Handmade Store - Handcrafted with Love</title>
        <meta name="description" content="Discover unique handcrafted products made with love and care. Shop handmade bags, pots, decor, jewelry, paintings, and wood craft." />
        <meta name="keywords" content="handmade, handcrafted, artisan, bags, pots, decor, jewelry, paintings, wood craft" />
        <meta property="og:title" content="Handmade Store - Handcrafted with Love" />
        <meta property="og:description" content="Discover unique handcrafted products made with love and care." />
        <meta property="og:type" content="website" />
      </Helmet>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<CustomerLayout><HomePage /></CustomerLayout>} />
        <Route path="/login" element={<SuspenseWrapper><LoginPage /></SuspenseWrapper>} />
        <Route path="/register" element={<SuspenseWrapper><RegisterPage /></SuspenseWrapper>} />
        <Route path="/verify-otp" element={<SuspenseWrapper><RegisterOtpPage /></SuspenseWrapper>} />
        <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPasswordPage /></SuspenseWrapper>} />
        <Route path="/reset-password" element={<SuspenseWrapper><ResetPasswordPage /></SuspenseWrapper>} />
        <Route path="/shop" element={<CustomerLayout><ShopPage /></CustomerLayout>} />
        <Route path="/product/:id" element={<CustomerLayout><ProductDetailPage /></CustomerLayout>} />
        <Route path="/cart" element={<ProtectedRoute><CustomerLayout><CartPage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><CustomerLayout><CheckoutPage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><CustomerLayout><OrderHistoryPage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><CustomerLayout><OrderDetailPage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><CustomerLayout><WishlistPage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><CustomerLayout><ProfilePage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><CustomerLayout><NotificationsPage /></CustomerLayout></ProtectedRoute>} />
        <Route path="/about" element={<CustomerLayout><AboutPage /></CustomerLayout>} />
        <Route path="/terms" element={<CustomerLayout><TermsPage /></CustomerLayout>} />
        <Route path="/privacy" element={<CustomerLayout><PrivacyPage /></CustomerLayout>} />

        <Route path="/seller" element={<RoleBasedRoute allowedRoles={SELLER_ROLES}><SellerLayout /></RoleBasedRoute>}>
          <Route path="dashboard" element={<SellerDashboard />} />
          <Route path="products" element={<SellerProducts />} />
          <Route path="products/add" element={<AddProduct />} />
          <Route path="products/edit/:id" element={<EditProduct />} />
          <Route path="orders" element={<SellerOrders />} />
          <Route path="earnings" element={<SellerEarnings />} />
        </Route>

        <Route path="/admin/login" element={<SuspenseWrapper><AdminLogin /></SuspenseWrapper>} />
        <Route path="/admin" element={<AdminProtectedRoute><SuspenseWrapper><AdminLayout /></SuspenseWrapper></AdminProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<AdminProductForm />} />
          <Route path="products/:id/edit" element={<AdminProductForm />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<AdminUserDetail />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="orders/:id" element={<AdminOrderDetail />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReports />} />
        </Route>

        <Route path="*" element={<SuspenseWrapper><NotFoundPage /></SuspenseWrapper>} />
      </Routes>
      <ChatWidget />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
