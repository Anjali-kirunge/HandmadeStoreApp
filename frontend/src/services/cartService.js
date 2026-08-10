import api from './api';

export const getCart = () => {
  return api.get('/cart');
};

export const addToCart = (data) => {
  return api.post('/cart', data);
};

export const updateCartItem = (productId, quantity) => {
  return api.put(`/cart/${productId}`, null, { params: { quantity } });
};

export const removeFromCart = (productId) => {
  return api.delete(`/cart/${productId}`);
};

export const clearCart = () => {
  return api.delete('/cart');
};
