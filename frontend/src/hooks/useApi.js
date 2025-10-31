import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000/backend/api';

export function createClient(token) {
  const instance = axios.create({
    baseURL: API_BASE,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response) {
        throw new Error(error.response.data?.error || 'خطای ناشناخته رخ داد');
      }
      throw new Error(error.message || 'عدم دسترسی به سرور');
    }
  );

  return instance;
}

export { API_BASE };
