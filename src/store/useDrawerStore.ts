import { create } from 'zustand';
import { ReactNode } from 'react';
import { DrawerProps } from '@/components';

type DrawerConfig = {
  isOpen: boolean;
  content: ReactNode;
  direction: DrawerProps['direction'];
  snapMode?: DrawerProps['snapMode'];
  snapPoints: DrawerProps['snapPoints'];
};

type DrawerStore = {
  bottomDrawer: DrawerConfig;
  leftDrawer: DrawerConfig;

  openBottomDrawer: (
    content: ReactNode,
    snapPoints?: DrawerConfig['snapPoints'],
    snapMode?: DrawerConfig['snapMode'],
  ) => void;
  closeBottomDrawer: () => void;

  openLeftDrawer: (content: ReactNode) => void;
  closeLeftDrawer: () => void;
};

export const useDrawerStore = create<DrawerStore>(set => ({
  bottomDrawer: {
    isOpen: false,
    content: null,
    direction: 'bottom',
    snapMode: 'snap',
    snapPoints: ['50%', '70%'],
  },

  leftDrawer: {
    isOpen: false,
    content: null,
    direction: 'left',
    snapPoints: ['100%'],
  },

  openBottomDrawer: (content, snapPoints = ['50%', '70%'], snapMode = 'snap') =>
    set(state => ({
      bottomDrawer: {
        ...state.bottomDrawer,
        isOpen: true,
        content,
        snapPoints,
        snapMode,
      },
    })),

  closeBottomDrawer: () =>
    set(state => ({
      bottomDrawer: {
        ...state.bottomDrawer,
        isOpen: false,
        content: null,
      },
    })),

  openLeftDrawer: content =>
    set(state => ({
      leftDrawer: {
        ...state.leftDrawer,
        isOpen: true,
        content,
      },
    })),

  closeLeftDrawer: () =>
    set(state => ({
      leftDrawer: {
        ...state.leftDrawer,
        isOpen: false,
        content: null,
      },
    })),
}));
