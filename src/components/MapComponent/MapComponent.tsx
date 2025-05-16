import { memo, useEffect } from 'react';
import { styles } from '@/styles';
import {
  useMapStyle,
  useMapInitialization,
  useOverlayLayer,
  useWaveBuoysLayer,
  useParticleLayer,
  useWaveBuoysLayerClickHandler,
  useMapGlobalClickHandlers,
} from '@/hooks';
import mapboxgl from 'mapbox-gl';
import { CircleDetails } from '../CircleDetails';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_KEY;

type MapComponentProps = {
  style: string;
  overlay: boolean;
  circle: boolean;
  particles: boolean;
  numParticles: number;
  dataset: string;
};

export const MapComponent = memo(
  ({ style, overlay, circle, particles, numParticles, dataset }: MapComponentProps) => {
    const { map, mapContainer } = useMapInitialization(
      styles.find(s => s.title === style)?.source || styles[0].source,
    );
    useOverlayLayer(map, overlay, style, dataset);
    useParticleLayer(map, particles, style, dataset, numParticles);
    useWaveBuoysLayer(map, circle, style, dataset);

    const {
      clickedPointData: waveBuoysLayerClickedPointData,
      openDrawer,
      waveBuoysLayerClicked,
    } = useWaveBuoysLayerClickHandler(map, circle);

    useEffect(() => {
      if (waveBuoysLayerClickedPointData) {
        openDrawer(<CircleDetails {...waveBuoysLayerClickedPointData} />);
      }
    }, [waveBuoysLayerClickedPointData, openDrawer]);

    useMapGlobalClickHandlers({ map, dataset, overlay, particles, waveBuoysLayerClicked });

    useMapStyle(map, style);

    return <div ref={mapContainer} className="w-full h-full" />;
  },
);
