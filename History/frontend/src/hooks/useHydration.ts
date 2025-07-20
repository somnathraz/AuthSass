import { useAppStore } from "@/store/appStore";

// hooks/useHydration.ts

export const useHydration = () => {
  return useAppStore((state) => state.hasHydrated);
};
