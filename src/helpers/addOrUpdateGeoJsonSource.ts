import { clusterMaxZoom } from '@/config';
import { addIdToFeatures } from '@/utils';

export function addOrUpdateGeoJsonSource({
  map,
  id,
  data,
  enableCluser = false,
  clusterRadius,
}: {
  map: mapboxgl.Map;
  id: string;
  data: GeoJSON.FeatureCollection | GeoJSON.Feature;
  enableCluser?: boolean;
  clusterRadius?: number;
}) {
  if ('features' in data) {
    addIdToFeatures(data.features);
  }

  const source = map.getSource(id);

  const sourceOptions = {
    type: 'geojson' as const,
    data: data,
    cluster: enableCluser,
    clusterMaxZoom: clusterMaxZoom,
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
