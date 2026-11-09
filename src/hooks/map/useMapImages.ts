import { TRIANGLE_MARKER_IMAGE_ID } from '@/constants';
import { drawTriangleMarkerImage } from '@/helpers';
import { useEffect } from 'react';

// Image id -> draw function. Ids match the `icon-image` used in layerSpecs.
const MAP_IMAGES: Record<string, () => { width: number; height: number; data: Uint8Array }> = {
  [TRIANGLE_MARKER_IMAGE_ID]: drawTriangleMarkerImage,
};

/**
 * Registers drawn images to Mapbox so symbol layers can use them.
 * 1. draw image (helpers, e.g. drawTriangleMarkerImage)
 * 2. register here
 * 3. symbol layers use it via `icon-image` (layerSpecs).
 */
export function useMapImages(map: React.RefObject<mapboxgl.Map | null>) {
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance) return;

    const handleImageMissing = (e: { id: string }) => {
      const draw = MAP_IMAGES[e.id];
      if (!draw || mapInstance.hasImage(e.id)) return;
      mapInstance.addImage(e.id, draw(), { sdf: true, pixelRatio: 1 });
    };

    mapInstance.on('styleimagemissing', handleImageMissing);
    return () => {
      mapInstance.off('styleimagemissing', handleImageMissing);
    };
  }, [map]);
}
