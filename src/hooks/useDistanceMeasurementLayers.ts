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
import { Layer } from 'mapbox-gl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/shallow';

export function useDistanceMeasurementLayers(map: React.RefObject<mapboxgl.Map | null>) {
  const { distanceMeasurement } = useMapUIStore(
    useShallow(s => ({
      distanceMeasurement: s.distanceMeasurement,
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
          ...measurePointsConfig,
        },
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

  const layers = useMemo(
    () => [measurePointsLayer, measureLineLayer],
    [measurePointsLayer, measureLineLayer],
  );

  const addLayersBackAfterStyleChanges = useCallback(
    (layers: Layer[]) => {
      addOrUpdateGeoJsonSource({
        map: map.current!,
        id: MEASURE_POINTS_SOURCE_ID,
        data: measurePointsGeojson,
      });
      layers.forEach(layer => addLayerInOrder(map, layer));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [measurePointsGeojson, layers],
  );

  useEffect(() => {
    layers.forEach(mlayer => {
      const layer = map.current?.getLayer(mlayer.id);
      if (!layer) return;
      if (mlayer.layout === layer.layout) return;
      if (mlayer.layout && 'visibility' in mlayer.layout) {
        map.current?.setLayoutProperty(
          mlayer.id,
          'visibility',
          distanceMeasurement ? 'visible' : 'none',
        );
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, distanceMeasurement]);

  useEffect(() => {
    const currentMap = map.current;
    const handleStyleLoad = () => addLayersBackAfterStyleChanges(layers);
    currentMap?.on('style.load', handleStyleLoad);
    return () => {
      currentMap?.off('style.load', handleStyleLoad);
      return;
    };
  }, [map, layers, addLayersBackAfterStyleChanges]);

  useEffect(() => {
    const measureSource = map.current?.getSource(MEASURE_POINTS_SOURCE_ID);
    if (!measureSource || measureSource.type !== 'geojson') return;

    measureSource.setData(measurePointsGeojson);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measurePointsGeojson]);

  return { measurePointsGeojson, setMeasurePointsGeojson };
}
