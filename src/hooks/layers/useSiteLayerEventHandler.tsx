import { createMapEventPriority } from '@/helpers';
import { useDrawerStore, openBottomDrawer } from '@/store';
import type { SiteFeature } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import {
  useSiteClusterClick,
  useSiteCursorStyle,
  useSiteHover,
  useSiteSelection,
  useSiteUnclusteredClick,
  useSiteZoomLimitClick,
} from './siteLayers';

type SiteLayerEventConfig = {
  enabled: boolean;
  distanceMeasurementEnabled: boolean;
  clusterLayerId: string;
  unclusteredLayerId: string;
  sourceId: string;
};

/**
 * Shared map-interaction wiring for clustered site products (wave buoys,
 * moorings, …): cluster click (zoom / fan-out), unclustered click → selection +
 * clicked data, hover popup, cursor style, and zoom-limit handling. Parameterized
 * by the product's layer/source IDs so every site product reuses it.
 */
export function useSiteLayerEventHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  {
    enabled,
    distanceMeasurementEnabled,
    clusterLayerId,
    unclusteredLayerId,
    sourceId,
  }: SiteLayerEventConfig,
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

  const { selectFeature, clearSelection } = useSiteSelection(map, sourceId);

  useSiteCursorStyle(map, enabled, clusterLayerId, unclusteredLayerId);

  useSiteClusterClick(map, enabled, shouldHandleMapClick, clusterLayerId, sourceId);

  useSiteUnclusteredClick(
    map,
    enabled,
    shouldHandleMapClick,
    selectFeature,
    setClickedPointData,
    unclusteredLayerId,
  );

  useSiteHover(map, enabled, unclusteredLayerId);

  useSiteZoomLimitClick(map, enabled, shouldHandleMapClick, setClickedPointData);

  // Clear selection when the drawer closes.
  useEffect(() => {
    if (!bottomDrawer.isOpen) {
      clearSelection();
    }
  }, [bottomDrawer.isOpen, clearSelection]);

  return {
    clickedPointData,
    openDrawer: openBottomDrawer,
    clearSelection,
  };
}
/**
 * how cluster works?
 * In a zoom level, if the points distance is within the clusterRadius, then these points will be clustered into one group.
 * With zoom-in, the points outside clusterRadius will move out from the clustered group and go into the unclustered layer.
 *
 * getClusterLeaves can get points inside a cluster.
 *
 * Another problem in geojson data: coordinate precision only has one decimal, but in e.features.geometry.coordinates the precision will have multiple decimals.
 * We can round the coordinates to one decimal to identify a point from geojson.
 *
 * queryRenderedFeatures can only get features displayed within viewport.
 */
