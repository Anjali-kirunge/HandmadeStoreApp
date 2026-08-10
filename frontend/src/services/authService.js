import api from './api';

export const login = (data) => {
  return api.post('/auth/login', data);
};

export const register = (data) => {
  return api.post('/auth/register', data);
};

export const verifyRegistrationOtp = (email, otp) => {
  return api.post('/auth/verify-registration-otp', { email, otp });
};

export const resendRegistrationOtp = (email) => {
  return api.post('/auth/resend-registration-otp', { email });
};

export const logout = (token) => {
  return api.post(
    '/auth/logout',
    {},
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
};

export const forgotPassword = (email) => {
  return api.post('/auth/forgot-password', { email });
};

export const resetPassword = (data) => {
  return api.post('/auth/reset-password', data);
};

export const refreshToken = (token) => {
  return api.post('/auth/refresh-token', { refreshToken: token });
};
