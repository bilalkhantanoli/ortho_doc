import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'doctor' | 'patient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string, role: UserRole) => {
        // Mock login - simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const user: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name: email.split('@')[0],
          role,
        };
        set({ user, isAuthenticated: true });
      },
      register: async (name: string, email: string, password: string, role: UserRole) => {
        // Mock register - simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        const user: User = {
          id: Math.random().toString(36).substr(2, 9),
          email,
          name,
          role,
        };
        set({ user, isAuthenticated: true });
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
