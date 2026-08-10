import api from './api';

export const getDashboard = () => {
  return api.get('/admin/dashboard');
};

export const getAllOrders = (params) => {
  return api.get('/admin/orders', { params });
};

export const updateOrderStatus = (id, data) => {
  return api.put(`/admin/orders/${id}/status`, data);
};

export const getOrdersByStatus = (status) => {
  return api.get(`/admin/orders/status/${status}`);
};

export const getAllReviews = (params) => {
  return api.get('/admin/reviews', { params });
};
