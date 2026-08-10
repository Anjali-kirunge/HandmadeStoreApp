import api from './client';

const params = (obj) => {
  const clean = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') clean[k] = v;
  });
  return clean;
};

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  logout: (token) =>
    api.post(
      '/auth/logout',
      {},
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    ),
};

export const dashboardApi = {
  get: () => api.get('/admin/dashboard'),
};

export const analyticsApi = {
  get: (from, to, topN) =>
    api.get('/admin/analytics', { params: params({ from, to, topN }) }),
};

export const productApi = {
  list: (keyword, status, page, size) =>
    api.get('/admin/products', { params: params({ keyword, status, page, size }) }),
  inventory: (keyword, status, page, size) =>
    api.get('/admin/products', { params: params({ keyword, status, page, size }) }),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/admin/products', data),
  update: (id, data) => api.put(`/admin/products/${id}`, data),
  remove: (id) => api.delete(`/admin/products/${id}`),
  setStock: (id, quantity) => api.put(`/admin/products/${id}/stock`, { quantity }),
  toggleFeatured: (id) => api.put(`/admin/products/${id}/featured`),
};

export const inventoryApi = {
  lowStock: () => api.get('/admin/inventory/low-stock'),
};

export const categoryApi = {
  list: (parentId) => api.get('/categories', { params: params({ parentId }) }),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const userApi = {
  list: (keyword, page, size) =>
    api.get('/admin/users', { params: params({ keyword, page, size }) }),
  get: (id) => api.get(`/admin/users/${id}`),
  orders: (id, page, size) =>
    api.get(`/admin/users/${id}/orders`, { params: params({ page, size }) }),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggle: (id) => api.put(`/admin/users/${id}/toggle`),
  remove: (id) => api.delete(`/admin/users/${id}`),
};

export const orderApi = {
  list: (keyword, status, page, size) =>
    api.get('/admin/orders', { params: params({ keyword, status, page, size }) }),
  get: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, orderStatus, trackingNumber) =>
    api.put(`/admin/orders/${id}/status`, params({ orderStatus, trackingNumber })),
  downloadInvoice: async (id) => {
    const res = await api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-order-${id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export const paymentApi = {
  list: (status, page, size) =>
    api.get('/admin/payments', { params: params({ status, page, size }) }),
};

export const couponApi = {
  list: () => api.get('/admin/coupons'),
  create: (data) => api.post('/admin/coupons', data),
  update: (id, data) => api.put(`/admin/coupons/${id}`, data),
  toggle: (id) => api.put(`/admin/coupons/${id}/toggle`),
  remove: (id) => api.delete(`/admin/coupons/${id}`),
};

export const reviewApi = {
  list: (page, size) =>
    api.get('/admin/reviews', { params: params({ page, size }) }),
  remove: (id) => api.delete(`/admin/reviews/${id}`),
};

export const notificationApi = {
  list: (email) => api.get('/admin/notifications', { params: params({ email }) }),
};

export const searchApi = {
  global: (q, limit) =>
    api.get('/admin/search', { params: params({ q, limit }) }),
};

export const reportApi = {
  download: async (type, format, filters = {}) => {
    const res = await api.get(`/admin/reports/${type}`, {
      params: params({ format, ...filters }),
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    const disposition = res.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^";]+)"?/);
    link.href = url;
    link.download = match ? match[1] : `handmade-${type}-report.${format === 'excel' ? 'xlsx' : format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
