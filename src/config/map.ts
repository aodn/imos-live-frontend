import { type StyleTitle } from '@/styles';
import { getLast31Dates } from '@/utils';
import { LngLat } from 'mapbox-gl';

export const CLUSTER_MAX_ZOOM = 7;

export const MAX_ZOOM = CLUSTER_MAX_ZOOM;

export const INITIAL_ZOOM = 3;
export const INITIAL_STYLEL: StyleTitle = 'ESRIWorldImagery';
export const INITIAL_CENTER = new LngLat(133.7751, -25.2744);
export const INITIAL_DATE = getLast31Dates().at(0)!;
