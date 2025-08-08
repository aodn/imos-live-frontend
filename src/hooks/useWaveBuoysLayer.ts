import { getWaveBuoyLocations } from '@/api';
import { useToast } from '@/components';
import {
  cacheConfig,
  unclusteredWaveBuoysLayerConfig,
  waveBuoyCluserLabelLayerConfig,
  waveBuoysLayerConfig,
} from '@/config';
import {
  UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
  WAVE_BUOYS_LAYER_ID,
  WAVE_BUOYS_SOURCE_ID,
} from '@/constants';
import { addLayerInOrder, addOrUpdateGeoJsonSource } from '@/helpers';
import { circleLayer, symbolLayer } from '@/layers';
import { useMapUIStore } from '@/store';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { useMapboxLayerVisibility } from './useMapboxLayerVisibility';

export function useWaveBuoysLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const {
    isMapReady,
    circle: isBuoyWavesLayerEnabled,
    dataset,
  } = useMapUIStore(
    useShallow(s => ({
      isMapReady: s.isMapReady,
      circle: s.circle,
      dataset: s.dataset,
    })),
  );

  const waveBuoysLayer = useMemo(
    () =>
      circleLayer({
        id: WAVE_BUOYS_LAYER_ID,
        source: WAVE_BUOYS_SOURCE_ID,
        ...waveBuoysLayerConfig,
      }),
    [],
  );
  const unClusteredWaveBuoysLayer = useMemo(
    () =>
      circleLayer({
        id: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
        source: WAVE_BUOYS_SOURCE_ID,
        ...unclusteredWaveBuoysLayerConfig,
      }),
    [],
  );
  const clusterLabelLayer = useMemo(
    () =>
      symbolLayer({
        id: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
        source: WAVE_BUOYS_SOURCE_ID,
        ...waveBuoyCluserLabelLayerConfig,
      }),
    [],
  );

  const { showToast } = useToast();
  const buoyQuery = useQuery({
    queryKey: ['wave_buoy_locations', dataset],
    queryFn: () => getWaveBuoyLocations(dataset),
    ...cacheConfig(dataset),
    enabled: isBuoyWavesLayerEnabled && dataset !== '',
  });

  useMapboxLayerVisibility(
    map,
    isMapReady,
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    isBuoyWavesLayerEnabled && !buoyQuery.isError,
  );

  useEffect(() => {
    const addLayersBackAfterStyleChanges = async () => {
      try {
        const data = await buoyQuery.promise;
        if (!data) return;
        addOrUpdateGeoJsonSource({
          map: map.current!,
          id: WAVE_BUOYS_SOURCE_ID,
          data,
          enableCluser: true,
          clusterRadius: 40,
        });

        addLayerInOrder(map, waveBuoysLayer);
        addLayerInOrder(map, unClusteredWaveBuoysLayer);
        addLayerInOrder(map, clusterLabelLayer);
      } catch (error) {
        console.error('Error adding layers back after style changes:', error);
        showToast({
          type: 'error',
          title: 'Error occurred',
          message: 'Failed to get buoys locations',
          duration: 6000,
        });
      }
    };

    map.current?.on('style.load', addLayersBackAfterStyleChanges);
    return () => {
      map.current?.off('style.load', addLayersBackAfterStyleChanges);
      return;
    };
  }, [map]);

  useEffect(() => {
    if (!buoyQuery.data) return;

    const waveBuoysSource = map.current?.getSource(WAVE_BUOYS_SOURCE_ID);
    if (!waveBuoysSource || waveBuoysSource.type !== 'geojson') return;

    waveBuoysSource.setData(buoyQuery.data);
  }, [buoyQuery.data]);
  return { waveBuoysLayer };
}
