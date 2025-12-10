import type { LngLat, Point } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import type { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { PopupContent } from '@/components';
import { queryClient } from '@/config';
import { QueryClientProvider } from '@tanstack/react-query';
import { gerMapMetaData } from './getOverlayData';

interface PopupWithRoot extends mapboxgl.Popup {
  __reactRoot?: Root | null;
}

type ShowPopUpArgs = {
  map: React.RefObject<mapboxgl.Map | null>;
  lngLat: LngLat;
  point: Point;
};

export function showPopup({ map, ...rest }: ShowPopUpArgs) {
  const { lat, lng } = rest.lngLat;
  if (!map.current || lat === undefined || lng === undefined) return;

  const { mapBounds, mapSize } = gerMapMetaData(map);
  if (!mapBounds || !mapSize) return;

  const container = document.createElement('div');
  container.className = 'custom-popup-container';
  const root = createRoot(container);

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    className: 'custom-popup',
    maxWidth: 'none',
    offset: 25,
  }) as PopupWithRoot;

  popup.__reactRoot = root;

  const cleanup = () => {
    if (popup.__reactRoot) {
      popup.__reactRoot.unmount();
      popup.__reactRoot = null;
    }
  };

  const closeFn = () => popup.remove();
  popup.on('close', cleanup);
  popup.on('remove', cleanup);
  root.render(
    <QueryClientProvider client={queryClient}>
      <PopupContent onClose={closeFn} mapBounds={mapBounds} mapSize={mapSize} {...rest} />
    </QueryClientProvider>,
  );

  popup.setLngLat([lng, lat]).setDOMContent(container).addTo(map.current);

  return popup;
}
