import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('epa_auth');
  if (stored) {
    const { token } = JSON.parse(stored);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('epa_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  updatePreferences: (data: { categories?: string[]; writingStyle?: string }) =>
    api.patch('/auth/preferences', data).then((r) => r.data),
};

export const topicsApi = {
  getAll: (params?: { page?: number; category?: string }) =>
    api.get('/topics', { params }).then((r) => r.data),
  getTrending: (limit = 10) =>
    api.get('/topics/trending', { params: { limit } }).then((r) => r.data),
  getById: (id: string) => api.get(`/topics/${id}`).then((r) => r.data),
};

export const pitchesApi = {
  getToday: () => api.get('/pitches/today').then((r) => r.data),
  // Changed to GET — no body, no validation issues
  generate: (topicId: string) =>
    api.get('/pitches/generate', { params: { topicId } }).then((r) => r.data),
  save: (pitchId: string) => api.post(`/pitches/${pitchId}/save`).then((r) => r.data),
  getSaved: () => api.get('/saved-ideas').then((r) => r.data),
};

export const notificationsApi = {
  getAll: (page = 1) => api.get('/notifications', { params: { page } }).then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r) => r.data),
};