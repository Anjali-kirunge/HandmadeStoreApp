import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export const clearAuthState = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  setAuthToken(null);
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;
    if (response && response.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      const hadAuthHeader = !!(config && config.headers && config.headers.Authorization);
      const isAuthEndpoint = !!(config && (config.url || '').includes('/auth/'));
      const alreadyRetried = !!(config && config._retry);

      if (hadAuthHeader && !isAuthEndpoint && !alreadyRetried && refreshToken) {
        config._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = axios
              .post(`${BASE_URL}/auth/refresh-token`, { refreshToken })
              .then((res) => res.data)
              .finally(() => {
                refreshPromise = null;
              });
          }
          const data = await refreshPromise;
          const newToken = data.token || data.data?.token;
          const newRefresh = data.refreshToken || data.data?.refreshToken;
          if (!newToken) {
            throw new Error('Token refresh returned no token');
          }
          localStorage.setItem('token', newToken);
          if (newRefresh) {
            localStorage.setItem('refresh_token', newRefresh);
          }
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        } catch (_refreshErr) {
          clearAuthState();
          redirectToLogin();
          return Promise.reject(error);
        }
      }

      clearAuthState();
      redirectToLogin();
    }
    return Promise.reject(error);
  }
);

export default api;
