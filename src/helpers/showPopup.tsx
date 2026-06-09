import type { LngLat } from 'mapbox-gl';
import mapboxgl from 'mapbox-gl';
import { type Root, createRoot } from 'react-dom/client';
import { queryClient } from '@/api/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

type PopupWithRoot = mapboxgl.Popup & {
  __reactRoot?: Root | null;
};

export type ClosePopupFn = () => PopupWithRoot;

type ShowPopUpArgs = {
  map: React.RefObject<mapboxgl.Map | null>;
  lngLat: LngLat;
  PopupContent: (closeFn: ClosePopupFn) => ReactNode;
};

export function showPopup({ map, PopupContent, lngLat }: ShowPopUpArgs) {
  const { lat, lng } = lngLat;
  if (!map.current || lat === undefined || lng === undefined) return;

  const container = document.createElement('div');
  container.className = 'custom-popup-container';
  const root = createRoot(container);

  const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: true,
    className: 'custom-popup',
    maxWidth: 'none',
    offset: 10,
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
    <QueryClientProvider client={queryClient}>{PopupContent(closeFn)}</QueryClientProvider>,
  );

  popup.setLngLat([lng, lat]).setDOMContent(container).addTo(map.current);

  return popup;
}
