import mapboxgl from 'mapbox-gl';
import { createRoot, Root } from 'react-dom/client';
import { PopupContent } from '@/components';
import { useMapPopupStore } from '@/store';

interface PopupWithRoot extends mapboxgl.Popup {
  __reactRoot?: Root | null;
}

export function showPopup(map: mapboxgl.Map) {
  const {
    metaData: { lngLat },
  } = useMapPopupStore.getState();

  const { lat, lng } = lngLat || {};
  if (lat === undefined || lng === undefined) return;

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
  root.render(<PopupContent onClose={closeFn} />);

  popup.setLngLat([lng, lat]).setDOMContent(container).addTo(map);

  return popup;
}
