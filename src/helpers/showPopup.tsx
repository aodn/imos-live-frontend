import mapboxgl from "mapbox-gl";
import { createRoot } from "react-dom/client";
import { PopupContent } from "../components";

type PopupOptions = {
  lat: number;
  lng: number;
  speed: number;
  direction: string;
  degree: number;
  gsla: number;
};

export function showPopup(map: mapboxgl.Map, options: PopupOptions) {
  const { lat, lng, speed, direction, degree, gsla } = options;

  const container = document.createElement("div");
  const root = createRoot(container);
  root.render(
    <PopupContent
      lat={lat}
      lng={lng}
      speed={speed}
      direction={direction}
      degree={degree}
      gsla={gsla}
    />,
  );

  new mapboxgl.Popup()
    .setLngLat([lng, lat])
    .setDOMContent(container)
    .addTo(map);
}
