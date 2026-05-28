import { type StyleTitle } from '@/styles';
import { getLast10Dates, getLast60Dates } from '@/utils';
import mapboxgl from 'mapbox-gl';

export const CLUSTER_MAX_ZOOM = 7;

export const MAX_ZOOM = CLUSTER_MAX_ZOOM;

export const INITIAL_ZOOM = 3;
export const INITIAL_STYLE: StyleTitle = 'Streets';
export const INITIAL_CENTER = new mapboxgl.LngLat(133.7751, -25.2744);
export const DATE_RANGE = getLast60Dates();
export const INITIAL_DATE = DATE_RANGE.at(-1)!;
export const INITIAL_WOULD_BOUNDARIES_ENABLED = true;
export const INITIAL_DISTANCE_MEASUREMENT_ENABLED = false;

export const QUERY_DATE_RANGE = getLast10Dates('yyyymmdd');

// Minimum map width in CSS (logical) pixels below which the export button is disabled.
export const MIN_EXPORT_MAP_WIDTH = 640;
