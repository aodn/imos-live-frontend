import { create } from 'zustand';
import { Product } from '@/constants';
import { LngLat, Point } from 'mapbox-gl';

export type ProductState = {
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

export type PopupDataState = {
  metaData: {
    lngLat?: LngLat;
    point?: Point;
    mapSize?: {
      width: number;
      height: number;
    };
    mapBounds?: [number, number, number, number];
  };
  loading: boolean;
};

export type PopupStoreState = PopupDataState & ProductState;

export type PopupStore = PopupStoreState & {
  updateMapPopupByKey: <K extends keyof PopupStore>(key: K, value: Partial<PopupStore[K]>) => void;
  batchUpdateMapPopup: (value: ProductState & Partial<PopupDataState>) => void;
};

export const initialProductState: ProductState = {
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
  ...initialProductState,
  metaData: {},
  loading: false,
  updateMapPopupByKey: (key, value) => {
    if (typeof value === 'object') {
      set(state => ({
        [key]: {
          ...(state[key] as object),
          ...value,
        },
      }));
    } else {
      set(() => ({
        [key]: value,
      }));
    }
  },
  clearMapPopupProduct: (key: keyof ProductState) =>
    updateMapPopupByKey(key, initialProductState[key]),
  /**
   * update all the present state, if not present, keep current state.
   * @param value
   * @returns
   */
  batchUpdateMapPopup: value =>
    set(state => ({
      ...state,
      ...value,
    })),
}));

//utils
export const { batchUpdateMapPopup, updateMapPopupByKey } = useMapPopupStore.getState();
export const currentPopupProductState = () => ({
  'gsla-anomaly-sea-levels': useMapPopupStore.getState()['gsla-anomaly-sea-levels'],
  'gsla-ocean-geostrophic-current': useMapPopupStore.getState()['gsla-ocean-geostrophic-current'],
  'sst-anom-mosaic': useMapPopupStore.getState()['sst-anom-mosaic'],
});
