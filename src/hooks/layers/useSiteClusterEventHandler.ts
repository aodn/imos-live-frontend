/**
 * how cluster works?
 * In a zoom level, if the points distance is within the clusterRadius, then these points will be clustered into one group.
 * With zoom-in, the points outside clusterRadius will move out from the clustered group and go into the unclustered layer.
 *
 * getClusterLeaves can get points inside a cluster.
 *
 * Another problem in geojson data: coordinate precision only has one decimal, but in e.features.geometry.coordinates the precision will have multiple decimals.
 * We can round the coordinates to one decimal to identify a point from geojson.
 *
 * queryRenderedFeatures can only get features displayed within viewport.
 */
import { CLUSTER_MAX_ZOOM, SITE_CLUSTER_LAYER_ID, SITE_CLUSTER_SOURCE_ID } from '@/constants';
import { createMapEventPriority, createZoomLimitPoints } from '@/helpers';
import type { Point } from 'geojson';
import { useEffect, useMemo } from 'react';

/**
 * Cluster click for the cluster layer shared by all site products (clusters can mix products).
 * Zooms into the cluster or creates zoom-limit temp points if max zoom is reached.
 */
export function useSiteClusterEventHandler(
  map: React.RefObject<mapboxgl.Map | null>,
  {
    enabled,
    distanceMeasurementEnabled,
  }: { enabled: boolean; distanceMeasurementEnabled: boolean },
) {
  const { shouldHandleMapClick } = useMemo(
    () => createMapEventPriority({ map, distanceMeasurementEnabled }),
    [map, distanceMeasurementEnabled],
  );

  useEffect(() => {
    if (!map.current || !enabled || !shouldHandleMapClick()) return;
    const mapInstance = map.current;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: [SITE_CLUSTER_LAYER_ID],
      });
      if (!features[0] || !features[0].properties) return;

      const clusterId = features[0].properties.cluster_id;
      const center = (features[0].geometry as Point).coordinates as [number, number];

      const source = mapInstance.getSource(SITE_CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource;

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

    mapInstance.on('click', SITE_CLUSTER_LAYER_ID, handleClick);
    return () => {
      mapInstance?.off('click', SITE_CLUSTER_LAYER_ID, handleClick);
    };
  }, [enabled, map, shouldHandleMapClick]);
}
