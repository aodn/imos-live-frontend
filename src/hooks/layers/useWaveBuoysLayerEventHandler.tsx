import { createMapEventPriority } from '@/helpers';
import { useDrawerStore, openBottomDrawer } from '@/store';
import type { WaveBuoySiteFeature } from '@/types';
import { useEffect, useMemo, useState } from 'react';
import {
  useWaveBuoysClusterClick,
  useWaveBuoysCursorStyle,
  useWaveBuoysHover,
  useWaveBuoysSelection,
  useWaveBuoysUnclusteredClick,
  useWaveBuoysZoomLimitClick,
} from './waveBuoys';

export function useWaveBuoysLayerEventHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  waveBuoyEnabled: boolean,
  distanceMeasurementEnabled: boolean,
) {
  const bottomDrawer = useDrawerStore(s => s.bottomDrawer);
  const [clickedPointData, setClickedPointData] = useState<
    Omit<WaveBuoySiteFeature, 'type'>[] | null
  >(null);

  const { shouldHandleMapClick } = useMemo(
    () =>
      createMapEventPriority({
        map,
        distanceMeasurementEnabled,
      }),
    [map, distanceMeasurementEnabled],
  );

  const { selectFeature, clearSelection } = useWaveBuoysSelection(map);

  useWaveBuoysCursorStyle(map, waveBuoyEnabled);

  useWaveBuoysClusterClick(map, waveBuoyEnabled, shouldHandleMapClick);

  useWaveBuoysUnclusteredClick(
    map,
    waveBuoyEnabled,
    shouldHandleMapClick,
    selectFeature,
    setClickedPointData,
  );

  useWaveBuoysHover(map, waveBuoyEnabled);

  useWaveBuoysZoomLimitClick(map, waveBuoyEnabled, shouldHandleMapClick, setClickedPointData);

  // Clear unclustered waveBuoyEnabled selection when drawer closed.
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
