import { OVERLAY_LAYER_ID, OverlaySource } from '@/constants';
import { rasterUrl } from '@/api';

export async function addOrUpdateWMSSource(
  map: mapboxgl.Map,
  overlaySource: OverlaySource,
  dataset: string,
) {
  const date = new Date(dataset);
  const url = await rasterUrl(overlaySource, date);
  const source = map.getSource(OVERLAY_LAYER_ID);
  if (source && source.type === 'raster') {
    source.setTiles([url]);
    return;
  }
  map.addSource(OVERLAY_LAYER_ID, {
    type: 'raster',
    tiles: [url],
    tileSize: 256,
  });
}
