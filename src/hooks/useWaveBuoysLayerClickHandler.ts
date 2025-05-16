import { WAVE_BUOYS_LAYER_ID } from '@/constants';
import { useDrawerStore } from '@/store';
import { WaveBuoyOgcProperties } from '@/types';
import { useEffect, useRef, useState } from 'react';

export function useWaveBuoysLayerClickHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  circle: boolean,
) {
  const waveBuoysLayerClicked = useRef(false);
  const { openDrawer } = useDrawerStore();
  const [clickedPointData, setClickedPointData] = useState<WaveBuoyOgcProperties | null>(null);

  useEffect(() => {
    if (!map.current) return;
    const mapInstace = map.current;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent & { originalEvent: MouseEvent }) => {
      const features = map.current!.queryRenderedFeatures(e.point, {
        layers: [WAVE_BUOYS_LAYER_ID],
      });
      waveBuoysLayerClicked.current = !!(features && features.length > 0);
    };

    mapInstace.on('mousedown', handleMouseDown);

    return () => {
      mapInstace?.off('mousedown', handleMouseDown);
    };
  }, [map]);

  useEffect(() => {
    if (!map.current || !circle) return;
    const mapInstace = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;
      const { properties } = e.features[0];
      setClickedPointData(properties as WaveBuoyOgcProperties);
    };

    mapInstace.on('click', WAVE_BUOYS_LAYER_ID, handleClick);

    return () => {
      mapInstace?.off('click', WAVE_BUOYS_LAYER_ID, handleClick);
    };
  }, [circle, map]);

  return { clickedPointData, openDrawer, waveBuoysLayerClicked };
}
