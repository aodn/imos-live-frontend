import type { RasterSource } from '@/constants';

type AddOrUpdateWMSSource = {
  map: mapboxgl.Map;
  sourceId: RasterSource;
  url: string;
};

export function addOrUpdateWMSSource({ map, sourceId, url }: AddOrUpdateWMSSource) {
  const source = map.getSource(sourceId);
  if (source && source.type === 'raster') {
    source.setTiles([url]);
    return;
  }

  map.addSource(sourceId, {
    type: 'raster',
    tiles: [url],
    tileSize: 256,
  });
}
