import { CLUSTER_MAX_ZOOM } from '@/constants';
import { addIdToFeatures } from './addIdToFeatures';

export function addOrUpdateGeoJsonSource({
  map,
  id,
  data,
  enableCluster = false,
  clusterRadius,
}: {
  map: mapboxgl.Map;
  id: string;
  data: GeoJSON.FeatureCollection | GeoJSON.Feature;
  enableCluster?: boolean;
  clusterRadius?: number;
}) {
  if ('features' in data) {
    addIdToFeatures(data.features);
  }

  const source = map.getSource(id);

  const sourceOptions = {
    type: 'geojson' as const,
    data: data,
    cluster: enableCluster,
    clusterMaxZoom: CLUSTER_MAX_ZOOM,
    ...(clusterRadius ? { clusterRadius } : {}),
    // CRITICAL: This tells Mapbox to use properties._id as the feature ID for state management
    // This is necessary because clustering can cause feature.id to be lost
    promoteId: '_id',
  };

  if (source && source.type === 'geojson') {
    source.setData(data);
  } else {
    map.addSource(id, sourceOptions);
  }
}
