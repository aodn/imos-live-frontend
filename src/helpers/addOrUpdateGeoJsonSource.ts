import { getWaveBuoyLocations } from '@/api';
import { clusterMaxZoom } from '@/config';
import { tryCatch, addIdToFeatures } from '@/utils';

export async function addOrUpdateGeoJsonSource({
  map,
  id,
  data,
  enableCluser = false,
  clusterRadius,
}: {
  map: mapboxgl.Map;
  id: string;
  data: string | GeoJSON.FeatureCollection | GeoJSON.Feature;
  enableCluser?: boolean;
  clusterRadius?: number;
}) {
  let dataSource: GeoJSON.FeatureCollection | GeoJSON.Feature | undefined;

  if (typeof data === 'string') {
    dataSource = await tryCatch(getWaveBuoyLocations(data));
  } else {
    dataSource = data;
  }

  if (!dataSource) {
    throw Error('No wave buoys data soruce');
  }

  if ('features' in dataSource) {
    addIdToFeatures(dataSource.features);
  }

  const source = map.getSource(id);
  if (source && source.type === 'geojson') {
    return source.setData(dataSource);
  }

  const sourceOptions = {
    type: 'geojson' as const,
    data: dataSource,
    cluster: enableCluser,
    clusterMaxZoom: clusterMaxZoom,
    ...(clusterRadius ? { clusterRadius } : {}),
    // CRITICAL: This tells Mapbox to use properties._id as the feature ID for state management
    // This is necessary because clustering can cause feature.id to be lost
    promoteId: '_id',
  };

  map.addSource(id, sourceOptions);
}
