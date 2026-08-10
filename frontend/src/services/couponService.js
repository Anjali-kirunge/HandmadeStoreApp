import api from './api';

export const getCoupons = () => {
  return api.get('/admin/coupons');
};

export const createCoupon = (data) => {
  return api.post('/admin/coupons', data);
};

export const updateCoupon = (id, data) => {
  return api.put(`/admin/coupons/${id}`, data);
};

export const deleteCoupon = (id) => {
  return api.delete(`/admin/coupons/${id}`);
};

export const applyCoupon = (data) => {
  return api.post('/coupons/apply', data);
};
