import axios from 'axios';

export const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const login = async (username, password) => {
  const response = await api.post('/api.php?action=login', { username, password });
  return response.data;
};

export const getMe = async () => {
  const response = await api.get('/api.php?action=me');
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/api.php?action=logout');
  return response.data;
};

export const getUnits = async () => {
  const response = await api.get('/api.php?action=units');
  return response.data;
};

export const createExitForm = async (data) => {
  const response = await api.post('/api.php?action=create_exit_form', data);
  return response.data;
};

export const createRepairForm = async (data) => {
  const response = await api.post('/api.php?action=create_repair_form', data);
  return response.data;
};

export const createEntryConfirm = async (data) => {
  const response = await api.post('/api.php?action=create_entry_confirm', data);
  return response.data;
};

export const searchForms = async (query) => {
  const response = await api.get(`/api.php?action=search_forms&q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getFormDetails = async (type, id) => {
  const response = await api.get(`/api.php?action=get_form_details&type=${type}&id=${id}`);
  return response.data;
};

export const getRecentForms = async (limit = 10) => {
  const response = await api.get(`/api.php?action=recent_forms&limit=${limit}`);
  return response.data;
};

export const getAllStatuses = async () => {
  const response = await api.get('/api.php?action=all_statuses');
  return response.data;
};

export const uploadFile = async (entityType, entityId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('entity_type', entityType);
  formData.append('entity_id', entityId);

  const response = await api.post('/upload.php', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getAttachments = async (entityType, entityId) => {
  const response = await api.get(
    `/api.php?action=get_attachments&entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(
      entityId,
    )}`,
  );
  return response.data;
};

export default api;
