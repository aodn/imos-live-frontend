import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export const useMapInitialization = (style: string) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current as HTMLElement,
      style,
      zoom: 3,
      antialias: true,
      projection: "mercator",
      touchPitch: false,
      touchZoomRotate: false,
    });
  }, [style]);

  return { map, mapContainer };
};
