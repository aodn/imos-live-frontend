import type { Point } from 'geojson';

// geojson's Point allows any-length `Position`; wave buoy points are always [lng, lat].
export type BuoyPoint = Point & { coordinates: [number, number] };
