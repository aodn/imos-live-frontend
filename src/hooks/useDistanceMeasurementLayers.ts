import { useState } from 'react';
import {
  MEASURE_LINES_LAYER_ID,
  MEASURE_LINES_SOURCE_ID,
  MEASURE_POINTS_LAYER_ID,
  MEASURE_POINTS_SOURCE_ID,
} from '@/constants';
import { circleLayer, lineLayer } from '@/layers';
import { layersOrder, measureLinesConfig, measurePointsConfig } from '@/config';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { sleep } from '@/utils';
import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { useMapboxLayerRef } from './useMapboxLayerRef';
import { useMapboxLayerSetup } from './useMapboxLayerSetup';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';
import { useDidMountEffect } from './useDidMountEffect';

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
        addLayerInOrder(map, layersOrder, measurePointsLayer.current, MEASURE_POINTS_LAYER_ID);
    }
    if (measureLineLayer.current) {
      if (!map.current?.getLayer(MEASURE_LINES_LAYER_ID))
        addLayerInOrder(map, layersOrder, measureLineLayer.current, MEASURE_LINES_LAYER_ID);
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
