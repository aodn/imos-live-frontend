import { DEFAULT_VIEW_BOUNDS } from '@/constants';
import type { Map } from 'mapbox-gl';

// Fit the map to Australia, sized to the current container.
// `isDefaultView` lets move handlers tell this fit from a user move.
export function fitDefaultView(map: Map, duration = 0) {
  map.fitBounds(DEFAULT_VIEW_BOUNDS, { duration }, { isDefaultView: true });
}
