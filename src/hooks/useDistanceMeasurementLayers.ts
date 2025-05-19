import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_LINES_SOURCE_ID,
  MEASURE_POINTS_LAYER_ID,
  MEASURE_POINTS_SOURCE_ID,
} from '@/constants';
import { circleLayer, lineLayer } from '@/layers';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { addOrUpdateGeoJsonSource } from '@/helpers';
import { measureLinesConfig, measurePointsConfig } from '@/config';
import { useState } from 'react';
import { useDidMountEffect } from './useDidMountEffect';
import { sleep } from '@/utils';

export function useDistanceMeasurementLayers(
  map: React.RefObject<mapboxgl.Map | null>,
  distanceMeasurement: boolean,
) {
  const [measurePointsGeojson, setMeasurePointsGeojson] = useState<
    FeatureCollection<Geometry, GeoJsonProperties>
  >({
    type: 'FeatureCollection',
    features: [],
  });

  const setupLayer = async () => {
    //it needs to be async so that it will run after style.onload finish, and this why await sleep(0) here.
    await sleep(0);
    if (measurePointsLayer.current) {
      addOrUpdateGeoJsonSource(map.current!, MEASURE_POINTS_SOURCE_ID, measurePointsGeojson);
      if (!map.current?.getLayer(MEASURE_POINTS_LAYER_ID))
        map.current?.addLayer(measurePointsLayer.current);
    }
    if (measureLineLayer.current) {
      if (!map.current?.getLayer(MEASURE_LINES_LAYER_ID))
        map.current?.addLayer(measureLineLayer.current, MEASURE_POINTS_LAYER_ID);
    }
  };

  const measurePointsLayer = useMapboxLayerRef(() =>
    circleLayer(
      { id: MEASURE_POINTS_LAYER_ID, source: MEASURE_POINTS_SOURCE_ID, ...measurePointsConfig },
      distanceMeasurement,
    ),
  );

  const measureLineLayer = useMapboxLayerRef(() =>
    lineLayer(
      {
        id: MEASURE_LINES_LAYER_ID,
        source: MEASURE_LINES_SOURCE_ID,
        ...measureLinesConfig,
      },
      distanceMeasurement,
    ),
  );

  const { loadComplete } = useMapboxLayerSetup(map, setupLayer);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;
    addOrUpdateGeoJsonSource(map.current!, MEASURE_POINTS_SOURCE_ID, measurePointsGeojson);
  }, [measurePointsGeojson]);

  useMapboxLayerVisibility(map, loadComplete, measurePointsLayer, distanceMeasurement);
  useMapboxLayerVisibility(map, loadComplete, measureLineLayer, distanceMeasurement);

  return { measurePointsGeojson, setMeasurePointsGeojson };
}
