//prettier-ignore-file
import { Layer } from 'mapbox-gl';

export const circleLayer = (id: string, source: string, visible: boolean): Layer => ({
  id,
  source,
  type: 'circle',
  layout: {
    visibility: visible ? 'visible' : 'none',
  },
  paint: {
    // prettier-ignore
    'circle-radius': [
      'interpolate',
      ['linear'],
    //   ['coalesce', ['get', 'significant_wave_height'], 0],
    //   0, 4,
    //   2, 12,
    //   4, 20,
    // ],
      ['coalesce', ['get', 'count'], 0],
          0, 4,
          10, 6,
          50, 8,
          200, 12,
          1000, 18,
          3000, 24,
    ],
    'circle-color': '#007cbf',
  },
});
