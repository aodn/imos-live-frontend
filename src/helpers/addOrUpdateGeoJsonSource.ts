import { getWaveBuoyLocations } from '@/api';
import { clusterMaxZoom } from '@/config';
import { tryCatch } from '@/utils';

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
    //remove layer and source when fail to get data.
    // const layers = map.getStyle().layers || [];

    // for (const layer of layers) {
    //   if (layer.source === id) {
    //     map.removeLayer(layer.id);
    //   }
    // }
    // if (map.getSource(id)) map.removeSource(id);
    // return;
    throw Error('No wave buoys data soruce');
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
  };

  map.addSource(id, sourceOptions);
}
