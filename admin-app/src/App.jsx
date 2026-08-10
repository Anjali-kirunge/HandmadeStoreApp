import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Payments from './pages/Payments';
import Coupons from './pages/Coupons';
import Reviews from './pages/Reviews';
import Inventory from './pages/Inventory';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="reports" element={<Reports />} />
      </Route>
      <Route path="/" element={<Navigate to="/admin/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
