import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  userId: number;
  setUserId: (id: number) => void;
  logout: () => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      userId: 1, // Fallback guest
      setUserId: (id: number) => set({ userId: id }),
      logout: () => set({ userId: 1 }),
    }),
    {
      name: 'aditya-auth-storage',
    }
  )
);