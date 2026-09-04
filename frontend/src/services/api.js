import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach Bearer token to request headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('notes_app_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global errors like token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If un-authorized, clear stored credentials
      localStorage.removeItem('notes_app_token');
      localStorage.removeItem('notes_app_user');
    }
    return Promise.reject(error);
  }
);

export default API;
