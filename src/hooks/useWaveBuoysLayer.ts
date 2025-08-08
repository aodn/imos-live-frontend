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
import { Layer } from 'mapbox-gl';
import { useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export function useWaveBuoysLayer(map: React.RefObject<mapboxgl.Map | null>) {
  const { circle: isBuoyWavesLayerEnabled, dataset } = useMapUIStore(
    useShallow(s => ({
      circle: s.circle,
      dataset: s.dataset,
    })),
  );

  const waveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoysLayerConfig,
        },
        isBuoyWavesLayerEnabled,
      ),
    [isBuoyWavesLayerEnabled],
  );
  const unClusteredWaveBuoysLayer = useMemo(
    () =>
      circleLayer(
        {
          id: UNCLUSTERED_WAVE_BUOYS_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...unclusteredWaveBuoysLayerConfig,
        },
        isBuoyWavesLayerEnabled,
      ),
    [isBuoyWavesLayerEnabled],
  );
  const clusterLabelLayer = useMemo(
    () =>
      symbolLayer(
        {
          id: WAVE_BUOYS_CLUSTER_LABEL_LAYER_ID,
          source: WAVE_BUOYS_SOURCE_ID,
          ...waveBuoyCluserLabelLayerConfig,
        },
        isBuoyWavesLayerEnabled,
      ),
    [isBuoyWavesLayerEnabled],
  );
  const buoyLayers = useMemo(
    () => [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
    [waveBuoysLayer, unClusteredWaveBuoysLayer, clusterLabelLayer],
  );

  const { showToast } = useToast();
  const buoyQuery = useQuery({
    queryKey: ['wave_buoy_locations', dataset],
    queryFn: () => getWaveBuoyLocations(dataset),
    ...cacheConfig(dataset),
    enabled: isBuoyWavesLayerEnabled && dataset !== '',
  });

  useEffect(() => {
    buoyLayers.forEach(buoyLayer => {
      const layer = map.current?.getLayer(buoyLayer.id);
      if (!layer) return;
      if (buoyLayer.layout === layer.layout) return;
      if (buoyLayer.layout && 'visibility' in buoyLayer.layout) {
        map.current?.setLayoutProperty(
          buoyLayer.id,
          'visibility',
          isBuoyWavesLayerEnabled ? 'visible' : 'none',
        );
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoyLayers, isBuoyWavesLayerEnabled]);

  const addLayersBackAfterStyleChanges = async (layers: Layer[]) => {
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

      layers.forEach(layer => addLayerInOrder(map, layer));
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

  useEffect(() => {
    const currentMap = map.current;
    const handleStyleLoad = () => addLayersBackAfterStyleChanges(buoyLayers);
    currentMap?.on('style.load', handleStyleLoad);
    return () => {
      currentMap?.off('style.load', handleStyleLoad);
      return;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, buoyLayers]);

  useEffect(() => {
    if (!buoyQuery.data) return;

    const waveBuoysSource = map.current?.getSource(WAVE_BUOYS_SOURCE_ID);
    if (!waveBuoysSource || waveBuoysSource.type !== 'geojson') return;

    waveBuoysSource.setData(buoyQuery.data);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buoyQuery.data]);
}
