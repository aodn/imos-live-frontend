import { createMapEventPriority } from '@/helpers';
import { useDrawerStore, openBottomDrawer } from '@/store';
import type { WaveBuoyPositionFeature } from '@/types';
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
    Omit<WaveBuoyPositionFeature, 'type'>[] | null
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
 * In a zoom level, if the points distance is within the clusterRadius, then these points will be clutered into one group.
 * With zoomin, the poins outsider clusterRadius will move out from clustered group and go into unclustered layer.
 *
 * getClusterLeaves can get points inside a cluser.
 *
 * And another problme in geojson data, coordinate precision only has one decimal, but in e.features.geometry.coordiates, the prcesion will have multiple decimals.
 * We can round the coordiates to one decimal to identify point from geojson.
 *
 * queryRenderedFeatures can only get features displayed within viewport.
 */
