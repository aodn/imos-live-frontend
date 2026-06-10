import { CLUSTER_MAX_ZOOM } from '@/constants';
import { PRODUCT, PRODUCTS } from '@/constants';
import { createZoomLimitPoints } from '@/helpers';
import type { Point } from 'geojson';
import { useEffect } from 'react';

/**
 * Handles click events on clustered wave buoys.
 * Zooms into cluster or creates zoom limit temp points if max zoom reached.
 */
export function useWaveBuoysClusterClick(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
  shouldHandle: () => boolean,
) {
  useEffect(() => {
    if (!map.current || !enabled || !shouldHandle()) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [PRODUCTS[PRODUCT.WAVE_BUOYS].layerId],
      });
      if (!features[0] || !features[0].properties) return;

      const clusterId = features[0].properties.cluster_id;
      const center = (features[0].geometry as Point).coordinates as [number, number];

      const source = mapInstance.getSource(
        PRODUCTS[PRODUCT.WAVE_BUOYS].sourceId,
      ) as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        if (typeof zoom === 'number' && zoom <= CLUSTER_MAX_ZOOM) {
          mapInstance.easeTo({
            center,
            zoom: zoom,
          });
        } else {
          source.getClusterLeaves(clusterId, Infinity, 0, (err, leaves) => {
            if (err || !leaves) return;
            createZoomLimitPoints(map, leaves, center);
          });
        }
      });
    };

    mapInstance.on('click', PRODUCTS[PRODUCT.WAVE_BUOYS].layerId, handleClick);
    return () => {
      mapInstance?.off('click', PRODUCTS[PRODUCT.WAVE_BUOYS].layerId, handleClick);
    };
  }, [enabled, map, shouldHandle]);
}
