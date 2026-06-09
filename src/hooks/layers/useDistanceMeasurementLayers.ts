import { MEASURE_LINES_CONFIG, MEASURE_POINT_CONFIG } from '@/constants';
import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_LINES_SOURCE_ID,
  MEASURE_POINTS_LAYER_ID,
  MEASURE_POINTS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { circleLayer, lineLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useCallback, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useDidMountEffect } from '../useDidMountEffect';

export function useDistanceMeasurementLayers(map: React.RefObject<mapboxgl.Map | null>) {
  const { distanceMeasurementEnabled } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurementEnabled: s.distanceMeasurementEnabled,
    })),
  );

  const [measurePointsGeojson, setMeasurePointsGeojson] = useState<
    FeatureCollection<Geometry, GeoJsonProperties>
  >({
    type: 'FeatureCollection',
    features: [],
  });

  const measurePointsLayer = useMemo(
    () =>
      circleLayer(
        {
          id: MEASURE_POINTS_LAYER_ID,
          source: MEASURE_POINTS_SOURCE_ID,
          ...MEASURE_POINT_CONFIG,
        },
        distanceMeasurementEnabled,
      ),
    [distanceMeasurementEnabled],
  );

  const measureLineLayer = useMemo(
    () =>
      lineLayer(
        {
          id: MEASURE_LINES_LAYER_ID,
          source: MEASURE_LINES_SOURCE_ID,
          ...MEASURE_LINES_CONFIG,
        },
        distanceMeasurementEnabled,
      ),
    [distanceMeasurementEnabled],
  );

  const layers = useMemo(
    () => [measurePointsLayer, measureLineLayer],
    [measurePointsLayer, measureLineLayer],
  );

  const setupLayer = useCallback(async () => {
    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: MEASURE_POINTS_SOURCE_ID,
      data: measurePointsGeojson,
    });
    layers.forEach(layer => {
      if (!map.current?.getLayer(layer.id)) addLayerInOrder(map, layer);
    });
  }, [layers, map, measurePointsGeojson]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [measurePointsGeojson]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [measurePointsLayer, measureLineLayer],
    distanceMeasurementEnabled,
  );

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: MEASURE_POINTS_SOURCE_ID,
      data: measurePointsGeojson,
    });
  }, [loadComplete, measurePointsGeojson]);

  return { measurePointsGeojson, setMeasurePointsGeojson };
}
