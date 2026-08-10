import api from './api';

export const createRazorpayOrder = (data) => {
  return api.post('/payments/create-order', data);
};

export const verifyRazorpayPayment = (data) => {
  return api.post('/payments/verify', data);
};
