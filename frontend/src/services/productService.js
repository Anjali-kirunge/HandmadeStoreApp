import api from './api';

export const searchProducts = (params) => {
  return api.get('/products/search', { params });
};

export const getProductById = (id) => {
  return api.get(`/products/${id}`);
};

export const getFeaturedProducts = (page = 0) => {
  return api.get('/products/featured', { params: { page } });
};

export const createProduct = (data) => {
  return api.post('/products', data);
};

export const updateProduct = (id, data) => {
  return api.put(`/products/${id}`, data);
};

export const deleteProduct = (id) => {
  return api.delete(`/products/${id}`);
};

export const updateStock = (id, quantity) => {
  return api.put(`/products/${id}/stock`, null, { params: { quantity } });
};

export const toggleFeatured = (id) => {
  return api.put(`/products/${id}/featured`);
};
