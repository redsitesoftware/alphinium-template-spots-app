import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
}

export interface AppState {
  // Auth
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;

  // UI
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => set({ token }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
}));

// ─── Selector helpers ─────────────────────────────────────────────────────────
// Use these to avoid unnecessary re-renders:
//   const user = useAppStore(selectUser);

export const selectUser = (s: AppState) => s.user;
export const selectToken = (s: AppState) => s.token;
export const selectIsAuthenticated = (s: AppState) => s.isAuthenticated;
export const selectIsLoading = (s: AppState) => s.isLoading;
export const selectError = (s: AppState) => s.error;
