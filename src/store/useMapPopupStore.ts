import { create } from 'zustand';
import { Product } from '@/constants';

export type PopupStoreState = {
  [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    speed?: number;
    direction?: string;
    degree?: number;
  };
  [Product.GSLA_ANOMALY_SEA_LEVELS]: {
    gsla?: number;
  };
  [Product.SST_ANOMALY_MOSAIC]: {
    sstAnom?: number;
  };
};

export type PopupStore = PopupStoreState & {
  updateMapPopupByKey: <K extends keyof PopupStore>(key: K, value: Partial<PopupStore[K]>) => void;
  updateAllMapPopup: (
    value: Partial<Omit<PopupStore, 'updateMapPopupByKey' | 'updateAllMapPopup'>>,
  ) => void;
};

const initialState: PopupStoreState = {
  [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: {
    speed: undefined,
    direction: undefined,
    degree: undefined,
  },
  [Product.GSLA_ANOMALY_SEA_LEVELS]: {
    gsla: undefined,
  },
  [Product.SST_ANOMALY_MOSAIC]: {
    sstAnom: undefined,
  },
};

export const useMapPopupStore = create<PopupStore>(set => ({
  ...initialState,
  updateMapPopupByKey: (key, value) =>
    set(state => ({
      [key]: {
        ...state[key],
        ...value,
      },
    })),
  updateAllMapPopup: value =>
    set(() => ({
      ...initialState,
      ...value,
    })),
}));

export const { updateAllMapPopup, updateMapPopupByKey } = useMapPopupStore.getState();
