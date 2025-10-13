import mapboxgl from 'mapbox-gl';
import { createRoot } from 'react-dom/client';
import { PopupContent } from '@/components';

type PopupOptions = {
  lat: number;
  lng: number;
  speed?: number;
  direction?: string;
  degree?: number;
  gsla?: number;
};

export function showPopup(map: mapboxgl.Map, options: PopupOptions) {
  const { lat, lng, speed, direction, degree, gsla } = options;

  const container = document.createElement('div');
  container.className = 'custom-popup-container';
  const root = createRoot(container);

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    className: 'custom-popup',
    maxWidth: 'none',
    offset: 25,
  });

  popup.on('close', () => {
    root.unmount();
  });

  root.render(
    <PopupContent
      lat={lat}
      lng={lng}
      speed={speed}
      direction={direction}
      degree={degree}
      gsla={gsla}
      onClose={() => popup.remove()}
    />,
  );

  popup.setLngLat([lng, lat]).setDOMContent(container).addTo(map);
}
