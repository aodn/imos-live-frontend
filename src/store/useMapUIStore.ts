/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CustomizableParticleConfig, ParticleConfig } from '@/config';
import {
  DATE_RANGE,
  INITIAL_CENTER,
  INITIAL_DATE,
  INITIAL_DISTANCE_MEASUREMENT_ENABLED,
  INITIAL_STYLE,
  INITIAL_WOULD_BOUNDARIES_ENABLED,
  INITIAL_ZOOM,
  INITIAL_PARTICLE_CONFIG,
} from '@/config';
import type { LegendArgs, ProductType, WebGlLayerProduct } from '@/constants';
import { PRODUCT, HEATMAP_GROUP, PRODUCTLEGENDS } from '@/constants';
import type { StyleTitle } from '@/styles';
import { type LngLat } from 'mapbox-gl';
import { create } from 'zustand';
import type { StateStorage } from 'zustand/middleware';
import { createJSONStorage, persist } from 'zustand/middleware';
import { deserialize, serialize } from './serialization';

type ProductError = Record<ProductType, boolean>;
type ProductLoading = Record<ProductType, boolean>;
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
  productLoading: ProductLoading;
  productLegends: Record<WebGlLayerProduct, LegendArgs>;
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
  setProductLoadingByProduct: (product: ProductType, loading: boolean) => void;
  setProductEnabledByProduct: (product: ProductType, enabled: boolean) => void;
  setProductLegend: (product: WebGlLayerProduct, legend: Partial<LegendArgs>) => void;
  getProductLegend: (product: WebGlLayerProduct) => LegendArgs;
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
    //filter out dates, productError, productLoading, and jumpToDate to sync in url
    const { dates, productError, productLoading, jumpToDate, ...rest } = state;

    return rest as MapUIState;
  },
};

export const useMapUIStore = create(
  persist<MapUIState>(
    (set, get) => ({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: INITIAL_STYLE,
      particleConfig: INITIAL_PARTICLE_CONFIG,
      distanceMeasurementEnabled: INITIAL_DISTANCE_MEASUREMENT_ENABLED,
      worldBoundariesEnabled: INITIAL_WOULD_BOUNDARIES_ENABLED,
      dates: DATE_RANGE,
      date: INITIAL_DATE,
      productEnabled: {
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: false,
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: false,
        [PRODUCT.SST_ANOMALY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: true,
        [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: false,
        [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: false,
      },
      productError: {
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: false,
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: false,
        [PRODUCT.SST_ANOMALY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: false,
        [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: false,
        [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: false,
      },
      productLoading: {
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: false,
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: false,
        [PRODUCT.SST_ANOMALY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: false,
        [PRODUCT.MARINE_HEATWAVE_DHD_MOSAIC]: false,
        [PRODUCT.MARINE_HEATWAVE_SSTA_MOSAIC]: false,
      },
      productLegends: Object.fromEntries(
        Object.entries(PRODUCTLEGENDS).map(([k, v]) => [k, { ...v }]),
      ) as Record<WebGlLayerProduct, LegendArgs>,
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
          if ((HEATMAP_GROUP as readonly ProductType[]).includes(product)) {
            for (const p of HEATMAP_GROUP) next[p] = p === product && enabled;
          } else {
            next[product] = enabled;
          }
          return { ...prev, productEnabled: next };
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
      setProductLoadingByProduct: (product, loading) => {
        set(prev => ({
          ...prev,
          productLoading: {
            ...prev.productLoading,
            [product]: loading,
          },
        }));
      },
      setProductLegend: (product, legend) =>
        set(prev => ({
          productLegends: {
            ...prev.productLegends,
            [product]: { ...prev.productLegends[product], ...legend },
          },
        })),
      getProductLegend: product => get().productLegends[product],
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
  setProductLoadingByProduct,
  setProductEnabledByProduct,
  setProductLegend,
  getProductLegend,
  setJumpToDate,
  clearJumpToDate,
} = useMapUIStore.getState();
