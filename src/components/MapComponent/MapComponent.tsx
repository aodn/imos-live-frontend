import { memo } from 'react';
import { styles } from '@/styles';
import {
  useMapStyle,
  useMapClickHandlers,
  useMapInitialization,
  useOverlayLayer,
  useWaveBuoysLayer,
  useParticleLayer,
} from '@/hooks';
import mapboxgl from 'mapbox-gl';

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
    useParticleLayer(map, particles, numParticles, style, dataset);
    useWaveBuoysLayer(map, circle, style, dataset);
    useMapStyle(map, style);
    useMapClickHandlers({
      map,
      dataset,
      overlay,
      particles,
      circle,
    });

    return <div ref={mapContainer} className="w-full h-full" />;
  },
);
