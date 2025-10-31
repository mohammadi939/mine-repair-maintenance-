import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = 'fa';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const { data } = await api.post('/auth/login', { username, password });
  return data;
};

export const logout = async () => {
  await api.post('/auth/logout');
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

export const fetchDashboard = async () => {
  const { data } = await api.get('/dashboard');
  return data;
};

export const getUnits = async () => {
  const { data } = await api.get('/units');
  return data;
};

export const getEquipments = async (params = {}) => {
  const { data } = await api.get('/equipments', { params });
  return data;
};

export const createEquipment = async (payload) => {
  const { data } = await api.post('/equipments', payload);
  return data;
};

export const fetchEquipmentDetails = async (id) => {
  const { data } = await api.get(`/equipments/${id}`);
  return data;
};

export const fetchEquipmentQr = async (id) => {
  const { data } = await api.get(`/equipments/${id}/qr`);
  return data;
};

export const createFailureReport = async (payload) => {
  const { data } = await api.post('/failures', payload);
  return data;
};

export const fetchFailureReports = async (params = {}) => {
  const { data } = await api.get('/failures', { params });
  return data;
};

export const updateFailureReport = async (id, payload) => {
  const { data } = await api.patch(`/failures/${id}`, payload);
  return data;
};

export const createExitRequest = async (payload) => {
  const { data } = await api.post('/exit-requests', payload);
  return data;
};

export const fetchExitRequests = async (params = {}) => {
  const { data } = await api.get('/exit-requests', { params });
  return data;
};

export const approveExitRequest = async (id) => {
  const { data } = await api.post(`/exit-requests/${id}/approve`);
  return data;
};

export const rejectExitRequest = async (id, reason) => {
  const { data } = await api.post(`/exit-requests/${id}/reject`, { reason });
  return data;
};

export const createRepairOrder = async (payload) => {
  const { data } = await api.post('/repair-orders', payload);
  return data;
};

export const fetchRepairOrders = async (params = {}) => {
  const { data } = await api.get('/repair-orders', { params });
  return data;
};

export const updateRepairOrder = async (id, payload) => {
  const { data } = await api.patch(`/repair-orders/${id}`, payload);
  return data;
};

export const createReEntryApproval = async (payload) => {
  const { data } = await api.post('/re-entry', payload);
  return data;
};

export const fetchReEntryApprovals = async (params = {}) => {
  const { data } = await api.get('/re-entry', { params });
  return data;
};

export const fetchTimeline = async (equipmentId, params = {}) => {
  const { data } = await api.get('/timeline', { params: { equipment_id: equipmentId, ...params } });
  return data;
};

export const fetchNotifications = async (params = {}) => {
  const { data } = await api.get('/notifications', { params });
  return data;
};

export const markNotificationSent = async (id) => {
  const { data } = await api.post(`/notifications/${id}/sent`);
  return data;
};

export const downloadFile = async (endpoint, filename) => {
  const response = await api.get(endpoint, { responseType: 'blob' });
  const blob = new Blob([response.data]);
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default api;
