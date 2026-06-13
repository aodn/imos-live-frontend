import { CLUSTER_MAX_ZOOM } from '@/constants';
import { createZoomLimitPoints } from '@/helpers';
import type { Point } from 'geojson';
import { useEffect } from 'react';

/**
 * Handles click events on a clustered site layer.
 * Zooms into the cluster or creates zoom-limit temp points if max zoom is reached.
 */
export function useSiteClusterClick(
  map: React.RefObject<mapboxgl.Map | null>,
  enabled: boolean,
  shouldHandle: () => boolean,
  clusterLayerId: string,
  sourceId: string,
) {
  useEffect(() => {
    if (!map.current || !enabled || !shouldHandle()) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [clusterLayerId],
      });
      if (!features[0] || !features[0].properties) return;

      const clusterId = features[0].properties.cluster_id;
      const center = (features[0].geometry as Point).coordinates as [number, number];

      const source = mapInstance.getSource(sourceId) as mapboxgl.GeoJSONSource;

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

    mapInstance.on('click', clusterLayerId, handleClick);
    return () => {
      mapInstance?.off('click', clusterLayerId, handleClick);
    };
  }, [enabled, map, shouldHandle, clusterLayerId, sourceId]);
}
