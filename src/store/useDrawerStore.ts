import { create } from "zustand";
import { ReactNode } from "react";

type DrawerStore = {
  isOpen: boolean;
  content: ReactNode;
  openDrawer: (content: ReactNode) => void;
  closeDrawer: () => void;
};

export const useDrawerStore = create<DrawerStore>((set) => ({
  isOpen: false,
  content: null,
  openDrawer: (content) => set({ isOpen: true, content }),
  closeDrawer: () => set({ isOpen: false, content: null }),
}));
