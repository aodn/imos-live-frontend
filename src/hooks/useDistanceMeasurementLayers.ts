import { useCallback, useMemo, useState } from 'react';
import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_LINES_SOURCE_ID,
  MEASURE_POINTS_LAYER_ID,
  MEASURE_POINTS_SOURCE_ID,
} from '@/constants';
import { circleLayer, lineLayer } from '@/layers';
import { measureLinesConfig, measurePointsConfig } from '@/config';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { sleep } from '@/utils';
import { selectDistanceMeasurementLayerStates, useMapUIStore } from '@/store';
import { useShallow } from 'zustand/shallow';

export function useDistanceMeasurementLayers(map: React.RefObject<mapboxgl.Map | null>) {
  const [measurePointsGeojson, setMeasurePointsGeojson] = useState<
    FeatureCollection<Geometry, GeoJsonProperties>
  >({
    type: 'FeatureCollection',
    features: [],
  });

  const { style, distanceMeasurement } = useMapUIStore(
    useShallow(selectDistanceMeasurementLayerStates),
  );

  const measurePointsLayer = useMemo(
    () =>
      circleLayer(
        { id: MEASURE_POINTS_LAYER_ID, source: MEASURE_POINTS_SOURCE_ID, ...measurePointsConfig },
        distanceMeasurement,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [style],
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [style],
  );

  const setupLayer = useCallback(async () => {
    await sleep(100);
    if (measurePointsLayer) {
      addOrUpdateGeoJsonSource({
        map: map.current!,
        id: MEASURE_POINTS_SOURCE_ID,
        data: measurePointsGeojson,
      });
      if (!map.current?.getLayer(MEASURE_POINTS_LAYER_ID))
        addLayerInOrder(map, measurePointsLayer, MEASURE_POINTS_LAYER_ID);
    }
    if (measureLineLayer) {
      if (!map.current?.getLayer(MEASURE_LINES_LAYER_ID))
        addLayerInOrder(map, measureLineLayer, MEASURE_LINES_LAYER_ID);
    }
  }, [map, measureLineLayer, measurePointsGeojson, measurePointsLayer]);

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer, [measurePointsGeojson, style]);

  useMapboxLayerVisibility(
    map,
    loadComplete,
    [measurePointsLayer, measureLineLayer],
    distanceMeasurement,
  );

  return { measurePointsGeojson, setMeasurePointsGeojson };
}
