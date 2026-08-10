import api from './api';

const otpService = {
  generateOtp: (email, type) => api.post('/otp/generate', { email, type }),
  verifyOtp: (email, otp, type) => api.post('/otp/verify', { email, otp, type }),
};

export default otpService;
