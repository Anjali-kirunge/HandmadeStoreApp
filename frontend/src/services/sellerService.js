import api from './api';

export const getDashboard = () => {
  return api.get('/seller/dashboard');
};

export const getOrders = (params) => {
  return api.get('/seller/orders', { params });
};

export const updateOrderStatus = (id, data) => {
  return api.put(`/seller/orders/${id}/status`, data);
};

export const getProducts = (params) => {
  return api.get('/products/seller', { params });
};
