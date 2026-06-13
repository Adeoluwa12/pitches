import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

// Type wrapper for Vite env
interface ImportMetaEnv {
  VITE_API_URL?: string;
}

// Type for import.meta
interface ImportMetaCustom extends ImportMeta {
  env: ImportMetaEnv;
}

declare const importMeta: ImportMetaCustom;
// Allow using import.meta.env correctly in Vite
const _importMeta = import.meta as ImportMetaCustom;

const api = axios.create({
  baseURL: (_importMeta.env && _importMeta.env.VITE_API_URL)
    ? `${_importMeta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use((config: AxiosRequestConfig) => {
  const stored = localStorage.getItem('epa_auth');
  if (stored && config.headers) {
    const { token } = JSON.parse(stored);
    if (token) (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res: AxiosResponse) => res,
  (error: any) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('epa_auth');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

// ─── Auth ──────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data).then((r: AxiosResponse) => r.data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((r: AxiosResponse) => r.data),
  me: () => api.get('/auth/me').then((r: AxiosResponse) => r.data),
  updatePreferences: (data: { categories?: string[]; writingStyle?: string }) =>
    api.patch('/auth/preferences', data).then((r: AxiosResponse) => r.data),
};

// ─── Topics ────────────────────────────────────────────────────────
export const topicsApi = {
  getAll: (params?: { page?: number; category?: string }) =>
    api.get('/topics', { params }).then((r: AxiosResponse) => r.data),
  getTrending: (limit = 10) =>
    api.get('/topics/trending', { params: { limit } }).then((r: AxiosResponse) => r.data),
  getById: (id: string) => api.get(`/topics/${id}`).then((r: AxiosResponse) => r.data),
};

// ─── Pitches ───────────────────────────────────────────────────────
export const pitchesApi = {
  getToday: () => api.get('/pitches/today').then((r: AxiosResponse) => r.data),
  generate: (topicId: string) =>
    api.post('/pitches/generate', null, { params: { topicId } }).then((r: AxiosResponse) => r.data),
  save: (pitchId: string) => api.post(`/pitches/${pitchId}/save`).then((r: AxiosResponse) => r.data),
  getSaved: () => api.get('/pitches/saved').then((r: AxiosResponse) => r.data),
};

// ─── Notifications ─────────────────────────────────────────────────
export const notificationsApi = {
  getAll: (page = 1) => api.get('/notifications', { params: { page } }).then((r: AxiosResponse) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r: AxiosResponse) => r.data),
  markAllRead: () => api.patch('/notifications/read-all').then((r: AxiosResponse) => r.data),
};
