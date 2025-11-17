import { create } from 'zustand';
import { Product } from '@/constants';
import { LngLat, Point } from 'mapbox-gl';

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
  metaData: {
    lngLat?: LngLat;
    point?: Point;
    mapSize?: {
      width: number;
      height: number;
    };
    mapBounds?: [number, number, number, number];
  };
};

export type PopupStore = PopupStoreState & {
  updateMapPopupByKey: <K extends keyof PopupStore>(key: K, value: Partial<PopupStore[K]>) => void;
  batchUpdateMapPopup: (
    value: Partial<Omit<PopupStore, 'updateMapPopupByKey' | 'updateAllMapPopup'>>,
  ) => void;
};

const initialState: Omit<PopupStoreState, 'metaData'> = {
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
  metaData: {},
  updateMapPopupByKey: (key, value) =>
    set(state => ({
      [key]: {
        ...state[key],
        ...value,
      },
    })),
  /**
   * update all the other state beside metaData and if certain state not in value, it will be reset to initial state.
   * @param value
   * @returns
   */
  batchUpdateMapPopup: value =>
    set(() => ({
      ...initialState,
      ...value,
    })),
}));

export const { batchUpdateMapPopup, updateMapPopupByKey } = useMapPopupStore.getState();
