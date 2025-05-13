//This file defines the types for the Wave Buoy OGC API response.
//endpoint: https://ogcapi-edge.aodn.org.au/api/v1/ogc/collections/uuid/items/summary
export interface WaveBuoyOgcFeatureCollection {
  type: 'FeatureCollection';
  features: WaveBuoyOgcFeature[];
}

export interface WaveBuoyOgcFeature {
  type: 'Feature';
  geometry: WaveBuoOgcyGeometry;
  properties: WaveBuoyOgcProperties;
}

export interface WaveBuoOgcyGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface WaveBuoyOgcProperties {
  date: string; // e.g., "2022-09"
  count: number;
}
