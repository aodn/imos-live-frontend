import { clusterMaxZoom } from '@/config';

export function addOrUpdateGeoJsonSource({
  map,
  id,
  url,
  enableCluser = false,
  clusterRadius,
}: {
  map: mapboxgl.Map;
  id: string;
  url: string | GeoJSON.FeatureCollection | GeoJSON.Feature;
  enableCluser?: boolean;
  clusterRadius?: number;
}) {
  const source = map.getSource(id);

  if (source && source.type === 'geojson') {
    return source.setData(url);
  }

  const sourceOptions = clusterRadius
    ? {
        type: 'geojson' as const,
        data: url,
        cluster: enableCluser,
        clusterMaxZoom: clusterMaxZoom,
        clusterRadius: clusterRadius,
      }
    : {
        type: 'geojson' as const,
        data: url,
        cluster: enableCluser,
        clusterMaxZoom: clusterMaxZoom,
      };

  map.addSource(id, sourceOptions);
}
