import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api';
import { getErrorMessage } from '../utils/helpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || 'null');
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const data = res.data;
      if (!data.user || data.user.role !== 'ROLE_ADMIN') {
        throw new Error('This account does not have admin access.');
      }
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        await authApi.logout(token);
      } catch (ignored) {
        // Server-side revocation is best-effort; local logout must still proceed.
      }
    }
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setUser(null);
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'admin_user') {
        try {
          setUser(JSON.parse(e.newValue || 'null'));
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const value = { user, loading, login, logout, getErrorMessage };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
