export function addOrUpdateVectorSource({
  map,
  id,
  url,
}: {
  map: mapboxgl.Map;
  id: string;
  url: string;
}) {
  const source = map.getSource(id);

  if (source && (source as mapboxgl.VectorTileSource).type === 'vector') {
    map.removeSource(id);
    map.addSource(id, { type: 'vector', url });
  } else {
    map.addSource(id, { type: 'vector', url });
  }
}
