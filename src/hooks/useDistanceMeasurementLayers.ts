import { measureLinesConfig, measurePointsConfig } from '@/config';
import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_LINES_SOURCE_ID,
  MEASURE_POINTS_LAYER_ID,
  MEASURE_POINTS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { circleLayer, lineLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

export function useDistanceMeasurementLayers(map: React.RefObject<mapboxgl.Map | null>) {
  const { distanceMeasurement, isMapReady } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurement: s.distanceMeasurement,
      isMapReady: s.isMapReady,
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
        { id: MEASURE_POINTS_LAYER_ID, source: MEASURE_POINTS_SOURCE_ID, ...measurePointsConfig },
        distanceMeasurement,
      ),
    [distanceMeasurement],
  );

  const measureLineLayer = useMemo(
    () =>
      lineLayer(
        {
          id: MEASURE_LINES_LAYER_ID,
          source: MEASURE_LINES_SOURCE_ID,
          ...measureLinesConfig,
        },
        distanceMeasurement,
      ),
    [distanceMeasurement],
  );

  useEffect(() => {
    if (!isMapReady) return;

    addOrUpdateGeoJsonSource({
      map: map.current!,
      id: MEASURE_POINTS_SOURCE_ID,
      data: measurePointsGeojson,
    });
    if (!map.current?.getLayer(measurePointsLayer.id)) addLayerInOrder(map, measurePointsLayer);
    if (!map.current?.getLayer(measureLineLayer.id)) addLayerInOrder(map, measureLineLayer);
  }, [isMapReady, measurePointsGeojson, measurePointsLayer, measureLineLayer]);

  useMapboxLayerVisibility(
    map,
    isMapReady,
    [measurePointsLayer, measureLineLayer],
    distanceMeasurement,
  );

  return { measurePointsGeojson, setMeasurePointsGeojson };
}
