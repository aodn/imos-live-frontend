import { createMapEventPriority } from '@/helpers';
import { useDrawerStore } from '@/store';
import { PRODUCT, SITE_CLUSTER_SOURCE_ID, type SiteProduct } from '@/constants';
import type { SiteFeature } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import {
  useSiteCursorStyle,
  useSiteHover,
  useSiteSelection,
  useSiteUnclusteredClick,
  useSiteZoomLimitClick,
} from './siteLayers';

type SiteUnclusteredLayerEventConfig = {
  product: SiteProduct;
  enabled: boolean;
  distanceMeasurementEnabled: boolean;
  unclusteredLayerId: string;
};

// Hover popup site-row label per site product.
const SITE_HOVER_LABEL: Record<SiteProduct, string> = {
  [PRODUCT.WAVE_BUOYS]: 'Wave Buoy',
  [PRODUCT.MOORING_TIMESERIES_REALTIME]: 'NRS Mooring',
  [PRODUCT.MOORING_ESTUARINE_COASTAL_WATER_QUALITY_MONITORING_REALTIME_QC]: 'Estuarine Mooring',
};

/**
 * Shared map-interaction wiring for site products (wave buoys, moorings, …):
 * unclustered click → selection + clicked data, hover popup, cursor style, and
 * zoom-limit handling. Parameterized by the product's unclustered layer ID so every
 * site product reuses it. Cluster clicks are shared, see `useSiteClusterEventHandler`.
 */
export function useSiteUnclusteredLayerEventHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  {
    product,
    enabled,
    distanceMeasurementEnabled,
    unclusteredLayerId,
  }: SiteUnclusteredLayerEventConfig,
) {
  const bottomDrawer = useDrawerStore(s => s.bottomDrawer);
  const [clickedPointData, setClickedPointData] = useState<Omit<SiteFeature, 'type'>[] | null>(
    null,
  );

  const { shouldHandleMapClick } = useMemo(
    () =>
      createMapEventPriority({
        map,
        distanceMeasurementEnabled,
      }),
    [map, distanceMeasurementEnabled],
  );

  const { selectFeature, clearSelection } = useSiteSelection(map, SITE_CLUSTER_SOURCE_ID);

  useSiteCursorStyle(map, enabled, unclusteredLayerId);

  useSiteUnclusteredClick(
    map,
    enabled,
    shouldHandleMapClick,
    selectFeature,
    setClickedPointData,
    unclusteredLayerId,
  );

  useSiteHover(map, enabled, unclusteredLayerId, SITE_HOVER_LABEL[product], product);

  useSiteZoomLimitClick(map, enabled, shouldHandleMapClick, setClickedPointData, product);

  // Clear selection when the drawer closes.
  useEffect(() => {
    if (!bottomDrawer.isOpen) {
      clearSelection();
    }
  }, [bottomDrawer.isOpen, clearSelection]);

  return {
    clickedPointData,
    clearSelection,
  };
}
