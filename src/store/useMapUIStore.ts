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
import { persist } from 'zustand/middleware';
import { storageOptions } from './urlSync';

type ProductError = Record<ProductType, boolean>;
type ProductLoading = Record<ProductType, boolean>;
export type ProductEnabled = Record<ProductType, boolean>;
export type ProductLegend = Record<TilesProduct, LegendArgs>;

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
  productLegends: ProductLegend;
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
