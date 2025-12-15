/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CustomizableParticleConfig, ParticleConfig } from '@/config';
import {
  INITIAL_CENTER,
  INITIAL_DATE,
  INITIAL_STYLEL,
  INITIAL_ZOOM,
  PARTICLE_INITIAL_CONFIG,
} from '@/config';
import type { ProductType } from '@/constants';
import { PRODUCT } from '@/constants';
import type { StyleTitle } from '@/styles';
import { getLast31Dates } from '@/utils';
import { type LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deserialize, serialize } from './serialization';

type ProductError = Record<ProductType, boolean>;
export type ProductEnabled = Record<ProductType, boolean>;

export interface MapUIState {
  center: LngLat;
  zoom: number;
  style: StyleTitle;
  particleConfig: ParticleConfig;
  distanceMeasurementEnabled: boolean;
  worldBoundariesEnabled: boolean;
  date: string;
  dates: string[];
  productEnabled: ProductEnabled;
  productError: ProductError;
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setParticleConfig: (config: Partial<CustomizableParticleConfig>) => void;
  setDistanceMeasurementEnabled: (v: boolean) => void;
  setWorldBoundariesEnabled: (v: boolean) => void;
  setDate: (d: string) => void;
  refreshDates: () => void;
  setProductErrorByProduct: (product: ProductType, error: boolean) => void;
  setProductEnabledByProduct: (product: ProductType, enabled: boolean) => void;
}

const hashStorage: StateStorage = {
  getItem: () => {
    const url = new URL(location.href);
    const restoredState: Record<string, any> = {};
    for (const [key, value] of url.searchParams.entries()) {
      restoredState[key] = deserialize(value);
    }

    // restore particleConfig with maxSpeed and colours from initial config
    if (restoredState.particleConfig) {
      restoredState.particleConfig = {
        ...restoredState.particleConfig,
        maxSpeed: PARTICLE_INITIAL_CONFIG.maxSpeed,
        colours: PARTICLE_INITIAL_CONFIG.colours,
      };
    }

    return JSON.stringify({ state: restoredState });
  },
  setItem: (_key, newValue) => {
    const { state } = JSON.parse(newValue);
    const url = new URL(location.href);
    for (const [k, v] of Object.entries(state)) {
      url.searchParams.set(k, serialize(v));
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
  //select fields intended to sync in url
  partialize: (state: MapUIState) => {
    //filter out dates and productError to sync in url
    const { dates, productError, ...rest } = state;

    // Filter out maxSpeed and colours from particleConfig
    const { maxSpeed, colours, ...customizableConfig } = rest.particleConfig;

    return {
      ...rest,
      particleConfig: customizableConfig,
    } as MapUIState;
  },
};

export const useMapUIStore = create(
  persist<MapUIState>(
    set => ({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: INITIAL_STYLEL,
      particleConfig: PARTICLE_INITIAL_CONFIG,
      distanceMeasurementEnabled: false,
      worldBoundariesEnabled: false,
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
      setDistanceMeasurementEnabled: distanceMeasurementEnabled =>
        set({ distanceMeasurementEnabled }),
      setWorldBoundariesEnabled: worldBoundariesEnabled => set({ worldBoundariesEnabled }),
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
  setDistanceMeasurementEnabled,
  setParticleConfig,
  setStyle,
  setWorldBoundariesEnabled,
  setZoom,
  refreshDates,
  setProductErrorByProduct,
  setProductEnabledByProduct,
} = useMapUIStore.getState();
