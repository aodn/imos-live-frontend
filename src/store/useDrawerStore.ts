import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { DrawerProps } from '@/components';
import { isSmallScreen } from '@/utils';

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

const isScreenSmall = isSmallScreen();
const defaultSnapPoints: DrawerProps['snapPoints'] = isScreenSmall
  ? (['70%', '90%'] as const)
  : (['60%'] as const);

export const useDrawerStore = create<DrawerStore>(set => ({
  bottomDrawer: {
    isOpen: false,
    content: null,
    direction: 'bottom',
    snapMode: 'snap',
    snapPoints: defaultSnapPoints,
  },

  leftDrawer: {
    isOpen: false,
    content: null,
    direction: 'left',
    snapPoints: ['100%'],
  },

  openBottomDrawer: (content, snapPoints = defaultSnapPoints, snapMode = 'snap') =>
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

export const { closeBottomDrawer, closeLeftDrawer, openBottomDrawer, openLeftDrawer } =
  useDrawerStore.getState();
