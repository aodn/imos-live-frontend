/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CustomizableParticleConfig, ParticleConfig } from '@/config';
import {
  DATE_RANGE,
  INITIAL_CENTER,
  INITIAL_DATE,
  INITIAL_DISTANCE_MEASUREMENT_ENABLED,
  INITIAL_STYLEL,
  INITIAL_WOULD_BOUNDARIES_ENABLED,
  INITIAL_ZOOM,
  INITIAL_PARTICLE_CONFIG,
} from '@/config';
import type { ProductType } from '@/constants';
import { PRODUCT, isRasterProduct } from '@/constants';
import type { StyleTitle } from '@/styles';
import { type LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deserialize, serialize } from './serialization';

type ProductError = Record<ProductType, boolean>;
export type ProductEnabled = Record<ProductType, boolean>;

export type JumpToDate = {
  date: string;
  trigger: number;
};

export type MapUIState = {
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
  jumpToDate: JumpToDate | null;
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
  setJumpToDate: (date: string) => void;
  clearJumpToDate: () => void;
};

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
        maxSpeed: INITIAL_PARTICLE_CONFIG.maxSpeed,
        colours: INITIAL_PARTICLE_CONFIG.colours,
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
    //filter out dates, productError, and jumpToDate to sync in url
    const { dates, productError, jumpToDate, ...rest } = state;

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
      particleConfig: INITIAL_PARTICLE_CONFIG,
      distanceMeasurementEnabled: INITIAL_DISTANCE_MEASUREMENT_ENABLED,
      worldBoundariesEnabled: INITIAL_WOULD_BOUNDARIES_ENABLED,
      dates: DATE_RANGE,
      date: INITIAL_DATE,
      productEnabled: {
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: true,
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: true,
        [PRODUCT.AUSTEMP_SSTA_MOSAIC]: false,
        [PRODUCT.AUSTEMP_DHD_MOSAIC]: false,
        [PRODUCT.AUSTEMP_SST_MOSAIC]: false,
        [PRODUCT.AUSTEMP_MHW_CATEGORY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: true,
      },
      productError: {
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: false,
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: false,
        [PRODUCT.AUSTEMP_SSTA_MOSAIC]: false,
        [PRODUCT.AUSTEMP_DHD_MOSAIC]: false,
        [PRODUCT.AUSTEMP_SST_MOSAIC]: false,
        [PRODUCT.AUSTEMP_MHW_CATEGORY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: false,
      },
      jumpToDate: null,
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
        const newDates = DATE_RANGE;
        set(prev => ({ ...prev, dates: newDates }));
      },
      setProductEnabledByProduct: (product, enabled) => {
        set(prev => {
          const next = { ...prev.productEnabled };
          if (enabled && isRasterProduct(product)) {
            for (const key of Object.keys(next) as ProductType[]) {
              if (isRasterProduct(key)) next[key] = false;
            }
          }
          next[product] = enabled;

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
      setJumpToDate: date => set({ jumpToDate: { date, trigger: Date.now() } }),
      clearJumpToDate: () => set({ jumpToDate: null }),
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
  setJumpToDate,
  clearJumpToDate,
} = useMapUIStore.getState();
