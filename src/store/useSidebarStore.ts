import { create } from 'zustand';

type SidebarStore = {
  isOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
};

export const useSidebarStore = create<SidebarStore>(set => ({
  isOpen: true,
  setSidebarOpen: (isOpen: boolean) => set({ isOpen }),
}));

export const { setSidebarOpen } = useSidebarStore.getState();
