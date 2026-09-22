import axios from 'axios';

/**
 * Configured Axios instance.
 * Base URL is controlled via VITE_API_BASE_URL environment variable.
 * Token is automatically attached from localStorage on every request.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hrms_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear auth state on unauthorized
      localStorage.removeItem('hrms_token');
      localStorage.removeItem('hrms_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
