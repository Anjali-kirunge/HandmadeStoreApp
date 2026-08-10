import api from './api';

export const placeOrder = (data) => {
  return api.post('/orders', data);
};

export const getOrders = (params) => {
  return api.get('/orders', { params });
};

export const getOrderById = (id) => {
  return api.get(`/orders/${id}`);
};

export const cancelOrder = (id) => {
  return api.put(`/orders/${id}/cancel`);
};
