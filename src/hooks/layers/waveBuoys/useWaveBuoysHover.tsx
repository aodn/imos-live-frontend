import { BuoyHoverPopupContent } from '@/components';
import { UNCLUSTERED_WAVE_BUOYS_LAYER_ID, ZOOM_LIMIT_TEMP_POINTS_LAYER_ID } from '@/constants';
import { type ClosePopupFn, coordinateToLngLat, showPopup } from '@/helpers';
import type { SitePoint, SiteProperties } from '@/types';
import { useEffect, useRef } from 'react';

/**
 * Handles hover events on wave buoy points, showing a popup with buoy info.
 * Manages popup lifecycle including delays for better UX.
 */
export function useWaveBuoysHover(map: React.RefObject<mapboxgl.Map | null>, enabled: boolean) {
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);
  const popupCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!map.current || !enabled) return;
    const mapInstance = map.current;

    const handleMouseEnter = (e: mapboxgl.MapMouseEvent) => {
      if (!e.features?.length) return;

      const { geometry, properties } = e.features[0];
      const { coordinates } = geometry as SitePoint;
      const { site, date } = properties as SiteProperties;

      const lngLat = coordinateToLngLat(coordinates);

      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }

      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }

      const popup = showPopup({
        map,
        lngLat,
        PopupContent: (closeFn: ClosePopupFn) => (
          <BuoyHoverPopupContent site={site || ''} date={date} onClose={closeFn} />
        ),
      });

      if (popup) {
        hoverPopupRef.current = popup;

        const popupElement = popup.getElement();
        if (popupElement) {
          const handlePopupMouseEnter = () => {
            if (popupCloseTimeoutRef.current) {
              clearTimeout(popupCloseTimeoutRef.current);
              popupCloseTimeoutRef.current = null;
            }
          };

          const handlePopupMouseLeave = () => {
            if (hoverPopupRef.current) {
              hoverPopupRef.current.remove();
              hoverPopupRef.current = null;
            }
          };

          // Add mouse enter and leave event to popup element
          popupElement.addEventListener('mouseenter', handlePopupMouseEnter);
          popupElement.addEventListener('mouseleave', handlePopupMouseLeave);

          popup.on('close', () => {
            popupElement.removeEventListener('mouseenter', handlePopupMouseEnter);
            popupElement.removeEventListener('mouseleave', handlePopupMouseLeave);
          });
        }
      }
    };

    const handleMouseLeave = () => {
      // Delay closing the popup to allow mouse to move to the popup
      popupCloseTimeoutRef.current = setTimeout(() => {
        if (hoverPopupRef.current) {
          hoverPopupRef.current.remove();
          hoverPopupRef.current = null;
        }
        popupCloseTimeoutRef.current = null;
      }, 200);
    };

    mapInstance.on('mouseenter', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseEnter);
    mapInstance.on('mouseleave', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseLeave);
    mapInstance.on('mouseenter', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseEnter);
    mapInstance.on('mouseleave', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseLeave);

    return () => {
      mapInstance?.off('mouseenter', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseEnter);
      mapInstance?.off('mouseleave', UNCLUSTERED_WAVE_BUOYS_LAYER_ID, handleMouseLeave);
      mapInstance.off('mouseenter', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseEnter);
      mapInstance.off('mouseleave', ZOOM_LIMIT_TEMP_POINTS_LAYER_ID, handleMouseLeave);

      // Clean up timeout and popup on unmount
      if (popupCloseTimeoutRef.current) {
        clearTimeout(popupCloseTimeoutRef.current);
        popupCloseTimeoutRef.current = null;
      }
      if (hoverPopupRef.current) {
        hoverPopupRef.current.remove();
        hoverPopupRef.current = null;
      }
    };
  }, [enabled, map]);
}
