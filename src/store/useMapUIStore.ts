import { CustomizableParticleConfig, ParticleConfig, particleInitialConfig } from '@/config';
import { PRODUCT, ProductType } from '@/constants';
import { StyleTitle } from '@/styles';
import { getLast31Dates } from '@/utils';
import { LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import { createJSONStorage, persist, StateStorage } from 'zustand/middleware';

type ProductError = Record<ProductType, boolean>;
export type ProductEnabled = Record<ProductType, boolean>;

export const INITIAL_DATE = getLast31Dates().at(0)!;

export interface MapUIState {
  center: LngLat;
  zoom: number;
  style: StyleTitle;
  particleConfig: ParticleConfig;
  distanceMeasurement: boolean;
  worldBoundaries: boolean;
  date: string;
  dates: string[];
  productEnabled: ProductEnabled;
  productError: ProductError;
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setParticleConfig: (config: Partial<CustomizableParticleConfig>) => void;
  setDistanceMeasurement: (v: boolean) => void;
  setWorldBoundaries: (v: boolean) => void;
  setDate: (d: string) => void;
  refreshDates: () => void;
  setProductErrorByProduct: (product: ProductType, error: boolean) => void;
  setProductEnabledByProduct: (product: ProductType, enabled: boolean) => void;
}

const stateKeysToExcludeFromUrl = ['dates', 'productError'];

const hashStorage: StateStorage = {
  getItem: () => {
    const url = new URL(location.href);
    const restoredState: Record<string, any> = {};
    for (const [key, value] of url.searchParams.entries()) {
      restoredState[key] = JSON.parse(value);
    }

    // restore particleConfig with maxSpeed and colours from initial config
    if (restoredState.particleConfig) {
      restoredState.particleConfig = {
        maxSpeed: particleInitialConfig.maxSpeed,
        colours: particleInitialConfig.colours,
        ...restoredState.particleConfig,
      };
    }

    return JSON.stringify({ state: restoredState });
  },
  setItem: (_key, newValue) => {
    const { state } = JSON.parse(newValue);
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(state)) {
      if (stateKeysToExcludeFromUrl.includes(k)) continue;

      // filter out maxSpeed and colours from particleConfig
      if (k === 'particleConfig') {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxSpeed, colours, ...customizableConfig } = v as ParticleConfig;
        url.searchParams.set(k, JSON.stringify(customizableConfig));
      } else {
        url.searchParams.set(k, JSON.stringify(v));
      }
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
      particleConfig: particleInitialConfig,
      distanceMeasurement: false,
      worldBoundaries: false,
      dates: getLast31Dates(),
      date: INITIAL_DATE,
      productEnabled: {
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: true,
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: true,
        [PRODUCT.SST_ANOMALY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: true,
      },
      productError: {
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: false,
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: false,
        [PRODUCT.SST_ANOMALY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: false,
      },
      setCenter: center => set({ center }),
      setZoom: zoom => set({ zoom }),
      setStyle: style => set({ style }),
      setParticleConfig: customizableParticleConfig =>
        set(prev => ({
          particleConfig: { ...prev.particleConfig, ...customizableParticleConfig },
        })),
      setDistanceMeasurement: distanceMeasurement => set({ distanceMeasurement }),
      setWorldBoundaries: worldBoundaries => set({ worldBoundaries }),
      setDate: date => set({ date }),
      refreshDates: () => {
        const newDates = getLast31Dates();
        set(prev => ({ ...prev, dates: newDates }));
      },
      setProductEnabledByProduct: (product, enabled) => {
        set(prev => {
          const next = { ...prev.productEnabled };
          if (product === PRODUCT.GSLA_ANOMALY_SEA_LEVELS) {
            next[PRODUCT.GSLA_ANOMALY_SEA_LEVELS] = enabled;
            if (next[PRODUCT.SST_ANOMALY_MOSAIC]) next[PRODUCT.SST_ANOMALY_MOSAIC] = !enabled;
          } else if (product === PRODUCT.SST_ANOMALY_MOSAIC) {
            next[PRODUCT.SST_ANOMALY_MOSAIC] = enabled;
            if (next[PRODUCT.GSLA_ANOMALY_SEA_LEVELS])
              next[PRODUCT.GSLA_ANOMALY_SEA_LEVELS] = !enabled;
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
  particleConfig,
  setCenter,
  setDate,
  setDistanceMeasurement,
  setParticleConfig,
  setStyle,
  setWorldBoundaries,
  setZoom,
  refreshDates,
  setProductErrorByProduct,
  setProductEnabledByProduct,
} = useMapUIStore.getState();
