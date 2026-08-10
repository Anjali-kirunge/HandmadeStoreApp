import api from './api';

export const getReviewsByProduct = (productId, params) => {
  return api.get(`/reviews/product/${productId}`, { params });
};

export const addReview = (productId, data) => {
  return api.post(`/reviews/product/${productId}`, data);
};

export const updateReview = (id, data) => {
  return api.put(`/reviews/${id}`, data);
};

export const deleteReview = (id) => {
  return api.delete(`/reviews/${id}`);
};

export const canReview = (productId) => {
  return api.get(`/reviews/product/${productId}/can-review`);
};
