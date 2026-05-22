import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { API_ENDPOINTS } from '@/utils/endpoints';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setLoading(false); return; }
    api.get(API_ENDPOINTS.AUTH.ME)
      .then((res) => { setUser(res.data.data); localStorage.setItem('user', JSON.stringify(res.data.data)); })
      .catch(() => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post(API_ENDPOINTS.AUTH.LOGIN, { identifier, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.data));
    setUser(res.data.data);
    return res.data.data;
  };

  const register = async (data) => {
    const res = await api.post(API_ENDPOINTS.AUTH.REGISTER, data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.data));
    setUser(res.data.data);
    return res.data.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isStaff = user && ['admin', 'staff'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
