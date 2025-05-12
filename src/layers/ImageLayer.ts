import { Layer } from 'mapbox-gl';

export const imageLayer = (id: string, source: string, visible: boolean): Layer => ({
  id,
  source,
  type: 'raster',
  layout: {
    visibility: visible ? 'visible' : 'none',
  },
  paint: {
    'raster-fade-duration': 0,
  },
});
