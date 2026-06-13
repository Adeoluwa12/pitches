import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  preferences: {
    categories: string[];
    excludedCategories: string[];
    writingStyle: string;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const stored = localStorage.getItem('epa_auth');
const initial = stored ? JSON.parse(stored) : { user: null, token: null };

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: !!initial.token,

  setAuth: (user, token) => {
    localStorage.setItem('epa_auth', JSON.stringify({ user, token }));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('epa_auth');
    set({ user: null, token: null, isAuthenticated: false });
  },
}));
