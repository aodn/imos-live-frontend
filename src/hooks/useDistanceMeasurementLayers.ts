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
      circleLayer({
        id: MEASURE_POINTS_LAYER_ID,
        source: MEASURE_POINTS_SOURCE_ID,
        ...measurePointsConfig,
      }),
    [],
  );

  const measureLineLayer = useMemo(
    () =>
      lineLayer({
        id: MEASURE_LINES_LAYER_ID,
        source: MEASURE_LINES_SOURCE_ID,
        ...measureLinesConfig,
      }),
    [],
  );

  useMapboxLayerVisibility(
    map,
    isMapReady,
    [measurePointsLayer, measureLineLayer],
    distanceMeasurement,
  );

  useEffect(() => {
    const addLayersBackAfterStyleChanges = async () => {
      addOrUpdateGeoJsonSource({
        map: map.current!,
        id: MEASURE_POINTS_SOURCE_ID,
        data: measurePointsGeojson,
      });
      addLayerInOrder(map, measurePointsLayer);
      addLayerInOrder(map, measureLineLayer);
    };

    map.current?.on('style.load', addLayersBackAfterStyleChanges);
    return () => {
      map.current?.off('style.load', addLayersBackAfterStyleChanges);
      return;
    };
  }, [map, measurePointsGeojson]);

  useEffect(() => {
    const measureSource = map.current?.getSource(MEASURE_POINTS_SOURCE_ID);
    if (!measureSource || measureSource.type !== 'geojson') return;

    measureSource.setData(measurePointsGeojson);
  }, [measurePointsGeojson]);

  return { measurePointsGeojson, setMeasurePointsGeojson };
}
