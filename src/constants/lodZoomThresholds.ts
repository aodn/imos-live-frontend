import type { LodZoomThresholds } from '@/AtlasRenderingSystem';
import { PRODUCT, type TilesProduct } from './products';

/**
 * Minimum map zoom to activate each on-demand LOD (LOD2+), per tiles product.
 * Overrides `DEFAULT_LOD_ZOOM_THRESHOLDS` from the AtlasRenderingSystem
 * package. LOD1 has no threshold — it's always active. A product with no
 * entry here (or a missing LOD key) just falls back to the package default.
 */
export const LOD_ZOOM_THRESHOLDS: Partial<Record<TilesProduct, LodZoomThresholds>> = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: { '2': 4, '3': 5, '4': 6 },
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: { '2': 4, '3': 5, '4': 6 },
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: { '2': 4, '3': 5, '4': 6 },
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: { '2': 4, '3': 5, '4': 6 },
  [PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]: { '2': 4, '3': 5, '4': 6 },
};
