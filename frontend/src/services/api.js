import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const isAuthEndpoint =
      original.url.includes('/auth/refresh') ||
      original.url.includes('/auth/login');

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const res = await axios.post(
          'http://localhost:5000/api/auth/refresh',
          {},
          { withCredentials: true }
        );
        const newToken = res.data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;