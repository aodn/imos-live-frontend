/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';
import { circleLayer } from '@/layers';
import { WAVE_BUOYS_LAYER_ID, WAVE_BUOYS_SOURCE_ID } from '@/constants';
import { addOrUpdateGeoJsonSource } from '@/helpers';
import { buildOgcBuoysUrl, sleep } from '@/utils';
import { useDidMountEffect } from './useDidMountEffect';

export function useWaveBuoysLayer(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
  style: string,
) {
  const [loadComplete, setLoadComplete] = useState(false);
  const waveBuoysLayer = useRef<mapboxgl.Layer | null>(null);

  // Initialize layers
  useEffect(() => {
    waveBuoysLayer.current = circleLayer(WAVE_BUOYS_LAYER_ID, WAVE_BUOYS_SOURCE_ID, circle);
  }, [style]);

  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const setupLayers = async () => {
      if (!waveBuoysLayer.current) return;

      await sleep(0);
      // this is to ensure that the map is fully loaded before adding layers
      // this is a workaround for the mapbox-gl-js bug where the map is not fully loaded
      // when the style.load event is fired

      addOrUpdateGeoJsonSource(
        mapInstance,
        WAVE_BUOYS_SOURCE_ID,
        buildOgcBuoysUrl('b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc'),
      );

      if (!mapInstance.getLayer(WAVE_BUOYS_LAYER_ID)) {
        mapInstance.addLayer(waveBuoysLayer.current);

        map.current!.setLayoutProperty(
          waveBuoysLayer.current.id,
          'visibility',
          circle ? 'visible' : 'none',
        );
      }
      setLoadComplete(true);
    };

    mapInstance.on('style.load', setupLayers);

    return () => {
      mapInstance.off('style.load', setupLayers);
    };
  }, [style]);

  // Toggle wave buoys visibility
  useEffect(() => {
    if (!map.current || !loadComplete || !waveBuoysLayer.current) return;
    map.current.setLayoutProperty(
      waveBuoysLayer.current.id,
      'visibility',
      circle ? 'visible' : 'none',
    );
  }, [loadComplete, circle]);

  useDidMountEffect(() => {
    if (!map.current || !loadComplete) return;

    addOrUpdateGeoJsonSource(
      map.current,
      WAVE_BUOYS_SOURCE_ID,
      buildOgcBuoysUrl('b299cdcd-3dee-48aa-abdd-e0fcdbb9cadc'),
    );
  }, [loadComplete]);
  return { waveBuoysLayer };
}
