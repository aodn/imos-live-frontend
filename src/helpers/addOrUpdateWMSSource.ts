import { OverlaySource } from '@/constants';
import { rasterUrl } from '@/helpers';

type AddOrUpdateWMSSource = {
  map: mapboxgl.Map;
  overlaySource: OverlaySource;
  date: string;
};

export async function addOrUpdateWMSSource({ map, overlaySource, date }: AddOrUpdateWMSSource) {
  const url = await rasterUrl(overlaySource, new Date(date));
  const source = map.getSource(overlaySource);
  if (source && source.type === 'raster') {
    source.setTiles([url]);
    return;
  }
  map.addSource(overlaySource, {
    type: 'raster',
    tiles: [url],
    tileSize: 256,
  });
}
