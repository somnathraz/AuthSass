import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role?: string;
}

interface AppStore {
  selectedAppId: string | null;
  setSelectedAppId: (id: string) => void;
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
  hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

export const useAppStore = create<AppStore>()(
    persist(
      (set) => ({
        selectedAppId: null,
        setSelectedAppId: (id) => set({ selectedAppId: id }),
        user: null,
        setUser: (user) => set({ user }),
        clearUser: () => set({ user: null }),
        hasHydrated: false,
        setHasHydrated: (state) => set({ hasHydrated: state }),
      }),
      {
        name: "app-storage",
        partialize: (state) => ({ user: state.user }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
        },
      }
    )
  );
  
