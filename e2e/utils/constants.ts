import { PRODUCT, PRODUCTS } from '@/constants';
import { serialize } from '@/store/serialization';

export const GSLA_PARTICLE_PRODUCT = PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT;
export const GSLA_ANOMALY_PRODUCT = PRODUCT.GSLA_ANOMALY_SEA_LEVELS;
export const GSLA_PARTICLE_LAYER_ID = PRODUCTS[GSLA_PARTICLE_PRODUCT].layerId;
export const GSLA_ANOMALY_LAYER_ID = PRODUCTS[GSLA_ANOMALY_PRODUCT].layerId;
export const WAVE_BUOYS_LAYER_ID = PRODUCTS[PRODUCT.WAVE_BUOYS].layerId;

// The page clock is pinned here; the dates below are the days the mocks serve.
export const CURRENT_DATE = new Date('2025-08-01T00:00:00.000Z');
export const DEFAULT_DAY = '2025-07-01';
export const NEXT_DAY = '2025-07-02';
export const DEEP_LINK_DAY = '2025-07-15';

const ALL_PRODUCTS_OFF = {
  [GSLA_PARTICLE_PRODUCT]: false,
  [GSLA_ANOMALY_PRODUCT]: false,
  [PRODUCT.WAVE_BUOYS]: false,
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: false,
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: false,
  [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: false,
};

// Pins the product baseline via the URL, so tests don't depend on
// INITIAL_PRODUCT_ENABLED (which enables several products by default).
export function productEnabledURL(enabled: (keyof typeof ALL_PRODUCTS_OFF | string)[] = []) {
  const flags = { ...ALL_PRODUCTS_OFF };
  for (const product of enabled) (flags as Record<string, boolean>)[product] = true;
  return `/?date=${DEFAULT_DAY}&productEnabled=${serialize(flags, 'productEnabled')}`;
}

export const NO_PRODUCTS_URL = productEnabledURL();
export const ONLY_WAVE_BUOYS_URL = productEnabledURL([PRODUCT.WAVE_BUOYS]);
