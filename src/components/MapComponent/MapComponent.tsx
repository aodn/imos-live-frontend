import { memo } from 'react';
import { styles } from '@/styles';
import {
  useMapLayers,
  useMapStyle,
  useMapClickHandlers,
  useMapInitialization,
  useMapData,
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
    useMapStyle(map, style);
    // const { loadComplete, particleLayer } = useMapLayers(
    //   map,
    //   overlay,
    //   circle,
    //   particles,
    //   numParticles,
    //   style,
    //   dataset,
    // );

    useOverlayLayer(map, overlay, style, dataset);
    useParticleLayer(map, particles, numParticles, style, dataset);
    useWaveBuoysLayer(map, circle, style);

    // useMapData(map, dataset, loadComplete, particleLayer);

    useMapClickHandlers({
      map,
      dataset,
      overlay,
      particles,
      circle,
    });

    //TODO: redesign the architectural pattern of the app, move from responsibility-centric patter to feature-centric(per-layer) pattern,
    // bceause the current pattern is not scalable and hard to maintain as the app grows with more features and layers.
    return <div ref={mapContainer} className="w-full h-full" />;
  },
);
