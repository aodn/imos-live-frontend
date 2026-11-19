import type { LodZoomThresholds } from '@/AtlasRenderingSystem';
import { PRODUCT, type TilesProduct } from './products';

// Same activation zooms for every tiles product today.
const SHARED_THRESHOLDS: LodZoomThresholds = { '2': 4, '3': 5, '4': 6 };

/**
 * Minimum map zoom to activate each on-demand LOD (LOD2+), per tiles product.
 * Overrides `DEFAULT_LOD_ZOOM_THRESHOLDS` from the AtlasRenderingSystem
 * package. LOD1 has no threshold — it's always active. A product with no
 * entry here (or a missing LOD key) just falls back to the package default.
 */
export const LOD_ZOOM_THRESHOLDS: Partial<Record<TilesProduct, LodZoomThresholds>> = {
  [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: SHARED_THRESHOLDS,
  [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: SHARED_THRESHOLDS,
  [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: SHARED_THRESHOLDS,
  [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: SHARED_THRESHOLDS,
  [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: SHARED_THRESHOLDS,
};
