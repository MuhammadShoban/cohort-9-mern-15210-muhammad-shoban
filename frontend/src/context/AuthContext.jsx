import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('notes_app_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('notes_app_token'));
  const [loading, setLoading] = useState(true);

  // Check auth state on load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await API.get('/auth/me');
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('notes_app_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.error('Failed to authenticate token:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  // Login handler
  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    if (data.success) {
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('notes_app_token', data.token);
      }
      setUser(data.user);
      localStorage.setItem('notes_app_user', JSON.stringify(data.user));
    }
    return data;
  };

  // Signup handler
  const signup = async (name, email, password) => {
    const { data } = await API.post('/auth/signup', { name, email, password });
    if (data.success) {
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('notes_app_token', data.token);
      }
      setUser(data.user);
      localStorage.setItem('notes_app_user', JSON.stringify(data.user));
    }
    return data;
  };

  // Logout handler
  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('notes_app_user');
      localStorage.removeItem('notes_app_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
