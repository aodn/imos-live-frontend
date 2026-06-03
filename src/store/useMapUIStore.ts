import type { ParticleConfig } from '@/AtlasRenderingSystem';
import {
  DATE_RANGE,
  INITIAL_CENTER,
  INITIAL_DATE,
  INITIAL_DISTANCE_MEASUREMENT_ENABLED,
  INITIAL_STYLE,
  INITIAL_WORLD_BOUNDARIES_ENABLED,
  INITIAL_ZOOM,
  INITIAL_PARTICLE_CONFIG,
  PRODUCTLEGENDS,
  INITIAL_PRODUCT_ENABLED,
  INITIAL_PRODUCT_ERROR,
  INITIAL_PRODUCT_LOADING,
  SCALAR_TILES_GROUP,
} from '@/constants';
import type { LegendArgs, ProductType, TilesProduct } from '@/constants';
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
  productLegends: Record<TilesProduct, LegendArgs>;
  jumpToDate: JumpToDate | null;
  setCenter: (center: LngLat) => void;
  setZoom: (zoom: number) => void;
  setStyle: (style: StyleTitle) => void;
  setParticleConfig: (config: Partial<ParticleConfig>) => void;
  setDistanceMeasurementEnabled: (v: boolean) => void;
  setWorldBoundariesEnabled: (v: boolean) => void;
  setDate: (d: string) => void;
  refreshDates: () => void;
  setProductErrorByProduct: (product: ProductType, error: boolean) => void;
  setProductLoadingByProduct: (product: ProductType, loading: boolean) => void;
  setProductEnabledByProduct: (product: ProductType, enabled: boolean) => void;
  setProductLegend: (product: TilesProduct, legend: Partial<LegendArgs>) => void;
  setJumpToDate: (date: string) => void;
  clearJumpToDate: () => void;
};

// The store keys synced to the URL — single source of truth for both reading
// params back in (`getItem`) and writing them out (`partialize`), so the two
// can't drift. Foreign query params (utm_*, OAuth callbacks, etc.) are ignored.
const URL_SYNCED_KEYS = [
  'center',
  'zoom',
  'style',
  'particleConfig',
  'distanceMeasurementEnabled',
  'worldBoundariesEnabled',
  'date',
  'productEnabled',
  'productLegends',
] as const satisfies readonly (keyof MapUIState)[];

const URL_SYNCED_KEY_SET = new Set<string>(URL_SYNCED_KEYS);

const hashStorage: StateStorage = {
  getItem: () => {
    const url = new URL(location.href);
    const restoredState: Record<string, unknown> = {};
    for (const [key, value] of url.searchParams.entries()) {
      if (!URL_SYNCED_KEY_SET.has(key)) continue;
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
  // Sync only the URL_SYNCED_KEYS subset to the URL (excludes transient state:
  // dates, productError, productLoading, jumpToDate).
  partialize: (state: MapUIState) => {
    const synced = {} as MapUIState;
    for (const k of URL_SYNCED_KEYS) {
      (synced as Record<string, unknown>)[k] = state[k];
    }
    return synced;
  },
};

export const useMapUIStore = create(
  persist<MapUIState>(
    set => ({
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      style: INITIAL_STYLE,
      particleConfig: INITIAL_PARTICLE_CONFIG,
      distanceMeasurementEnabled: INITIAL_DISTANCE_MEASUREMENT_ENABLED,
      worldBoundariesEnabled: INITIAL_WORLD_BOUNDARIES_ENABLED,
      dates: DATE_RANGE,
      date: INITIAL_DATE,
      productEnabled: INITIAL_PRODUCT_ENABLED,
      productError: INITIAL_PRODUCT_ERROR,
      productLoading: INITIAL_PRODUCT_LOADING,
      productLegends: Object.fromEntries(
        Object.entries(PRODUCTLEGENDS).map(([k, v]) => [k, { ...v }]),
      ) as Record<TilesProduct, LegendArgs>,
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
      refreshDates: () => set({ dates: DATE_RANGE }),
      setProductEnabledByProduct: (product, enabled) => {
        set(prev => {
          const next = { ...prev.productEnabled };
          if ((SCALAR_TILES_GROUP as readonly ProductType[]).includes(product)) {
            for (const p of SCALAR_TILES_GROUP) next[p] = p === product && enabled;
          } else {
            next[product] = enabled;
          }
          return { productEnabled: next };
        });
      },
      setProductErrorByProduct: (product, error) => {
        set(prev => ({
          productError: {
            ...prev.productError,
            [product]: error,
          },
        }));
      },
      setProductLoadingByProduct: (product, loading) => {
        set(prev => ({
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
      setJumpToDate: date => set({ jumpToDate: { date, trigger: Date.now() } }),
      clearJumpToDate: () => set({ jumpToDate: null }),
    }),
    storageOptions,
  ),
);

//utils
export const {
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
  setJumpToDate,
  clearJumpToDate,
} = useMapUIStore.getState();

export function getProductLegend(product: TilesProduct): LegendArgs {
  return useMapUIStore.getState().productLegends[product];
}
