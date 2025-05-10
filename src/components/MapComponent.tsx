import { memo, useState } from "react";
import { styles } from "@/styles";
import {
  useMapClickHandlers,
  useMapInitialization,
  useMapLayers,
  useMapStyle,
  useMapDataset,
} from "@/hooks";
import mapboxgl from "mapbox-gl";

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
  ({
    style,
    overlay,
    circle,
    particles,
    numParticles,
    dataset,
  }: MapComponentProps) => {
    const [loadComplete, setLoadComplete] = useState(false);

    const { map, mapContainer } = useMapInitialization(
      styles.find((s) => s.title === style)?.source || styles[0].source,
    );
    const { particleLayer, overlayLayer, waveBuoysLayer } = useMapLayers(
      map,
      loadComplete,
      overlay,
      circle,
      particles,
      numParticles,
      style,
    );
    useMapStyle(map, style);
    useMapDataset(
      map,
      dataset,
      loadComplete,
      setLoadComplete,
      particleLayer,
      overlayLayer,
      waveBuoysLayer,
    );
    useMapClickHandlers({
      map,
      dataset,
      overlay,
      particles,
      circle,
    });

    return (
      <div className="w-full h-full">
        <div ref={mapContainer} className="w-full h-full" />
      </div>
    );
  },
);
