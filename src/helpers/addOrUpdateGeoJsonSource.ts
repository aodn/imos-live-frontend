import { clusterMaxZoom } from '@/config';

export function addOrUpdateGeoJsonSource({
  map,
  id,
  url,
  enableCluser = false,
}: {
  map: mapboxgl.Map;
  id: string;
  url: string | GeoJSON.FeatureCollection | GeoJSON.Feature;
  enableCluser?: boolean;
}) {
  const source = map.getSource(id);

  if (source && source.type === 'geojson') {
    source.setData(url);
  } else {
    map.addSource(id, {
      type: 'geojson',
      data: url,
      cluster: enableCluser,
      clusterMaxZoom: clusterMaxZoom,
      clusterRadius: 40,
    });
  }
}
