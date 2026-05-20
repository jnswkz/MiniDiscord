import { create } from "zustand";
import type { User, LoginRequest, RegisterRequest, AuthResponse, ApiResponse } from "@/types";
import { api } from "@/lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (data: LoginRequest) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", data);
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Login failed";
      set({ error: message, isLoading: false });
    }
  },

  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/google", { idToken });
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Google login failed";
      set({ error: message, isLoading: false });
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<ApiResponse<AuthResponse>>("/auth/register", data);
      const { token, user } = res.data.data;
      localStorage.setItem("token", token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Registration failed";
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Backend logout failed:", err);
    }
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  setUser: (user) => set({ user }),

  hydrate: async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      set({ token, isAuthenticated: true });
    }
    try {
      const res = await api.get<ApiResponse<User>>("/users/me");
      set({ user: res.data.data, isAuthenticated: true });
    } catch (err) {
      console.error("Failed to fetch user data on hydrate", err);
      if (!token) {
        set({ user: null, token: null, isAuthenticated: false });
      }
    }
  },
}));
