import { Product } from '@/constants';
import { StyleTitle } from '@/styles';
import { getLast31Dates, getLast7Dates } from '@/utils';
import { LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

export type NumParticles = 10000 | 30000 | 60000 | 100000;
type ProductError = Record<Product, boolean>;
export type ProductEnabled = Record<Product, boolean>;

export const INITIAL_DATE = getLast31Dates().at(0)!;

export interface MapUIState {
  center: LngLat;
  zoom: number;
  style: StyleTitle;
  numParticles: NumParticles;
  distanceMeasurement: boolean;
  worldBoundaries: boolean;
  date: string;
  dates: string[];
  productEnabled: ProductEnabled;
  productError: ProductError;
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setNumParticles: (n: NumParticles) => void;
  setDistanceMeasurement: (v: boolean) => void;
  setWorldBoundaries: (v: boolean) => void;
  setDate: (d: string) => void;
  refreshDates: () => void;
  setProductErrorByProduct: (product: Product, error: boolean) => void;
  setProductEnabledByProduct: (product: Product, enabled: boolean) => void;
}

const stateKeysToExcludeFromUrl = ['dates', 'productError'];

const hashStorage: StateStorage = {
  getItem: () => {
    const url = new URL(location.href);
    const restoredState: Record<string, string> = {};
    for (const [key, value] of url.searchParams.entries()) {
      restoredState[key] = JSON.parse(value);
    }
    return JSON.stringify({ state: restoredState });
  },
  setItem: (_key, newValue) => {
    const { state } = JSON.parse(newValue);
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(state)) {
      if (stateKeysToExcludeFromUrl.includes(k)) continue;
      url.searchParams.set(k, JSON.stringify(v));
    }
    window.history.replaceState({}, '', url.toString());
  },
  removeItem: key => {
    const url = new URL(location.href);
    url.searchParams.delete(key);
    window.history.replaceState({}, '', url.toString());
  },
};

const storageOptions = {
  name: 'url-sync',
  storage: createJSONStorage<MapUIState>(() => hashStorage),
};

export const useMapUIStore = create(
  persist<MapUIState>(
    set => ({
      center: new LngLat(133.7751, -25.2744),
      zoom: 3,
      style: 'ESRIWorldImagery',
      numParticles: 10000,
      distanceMeasurement: false,
      worldBoundaries: false,
      dates: getLast7Dates(),
      date: INITIAL_DATE,
      productEnabled: {
        [Product.GSLA_ANOMALY_SEA_LEVELS]: true,
        [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: true,
        [Product.SST_ANOMALY_MOSAIC]: false,
        [Product.WAVE_BUOYS]: true,
      },
      productError: {
        [Product.GSLA_ANOMALY_SEA_LEVELS]: false,
        [Product.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: false,
        [Product.SST_ANOMALY_MOSAIC]: false,
        [Product.WAVE_BUOYS]: false,
      },
      setCenter: center => set({ center }),
      setZoom: zoom => set({ zoom }),
      setStyle: style => set({ style }),
      setNumParticles: numParticles => set({ numParticles }),
      setDistanceMeasurement: distanceMeasurement => set({ distanceMeasurement }),
      setWorldBoundaries: worldBoundaries => set({ worldBoundaries }),
      setDate: date => set({ date }),
      refreshDates: () => {
        const newDates = getLast7Dates();
        set(prev => ({ ...prev, dates: newDates }));
      },
      setProductEnabledByProduct: (product, enabled) => {
        set(prev => {
          const next = { ...prev.productEnabled };
          if (product === Product.GSLA_ANOMALY_SEA_LEVELS) {
            next[Product.GSLA_ANOMALY_SEA_LEVELS] = enabled;
            if (next[Product.SST_ANOMALY_MOSAIC]) next[Product.SST_ANOMALY_MOSAIC] = !enabled;
          } else if (product === Product.SST_ANOMALY_MOSAIC) {
            next[Product.SST_ANOMALY_MOSAIC] = enabled;
            if (next[Product.GSLA_ANOMALY_SEA_LEVELS])
              next[Product.GSLA_ANOMALY_SEA_LEVELS] = !enabled;
          } else {
            next[product] = enabled;
          }

          return {
            ...prev,
            productEnabled: next,
          };
        });
      },
      setProductErrorByProduct: (product, error) => {
        set(prev => ({
          ...prev,
          productError: {
            ...prev.productError,
            [product]: error,
          },
        }));
      },
    }),
    storageOptions,
  ),
);

//utils
export const {
  setCenter,
  setDate,
  setDistanceMeasurement,
  setNumParticles,
  setStyle,
  setWorldBoundaries,
  setZoom,
  refreshDates,
  setProductErrorByProduct,
  setProductEnabledByProduct,
} = useMapUIStore.getState();
