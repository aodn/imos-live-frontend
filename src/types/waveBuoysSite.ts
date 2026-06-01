import type { BuoyPoint } from './waveBuoysPoint';

export type WaveBuoySiteProperties = {
  date: string;
  buoy: string;
  _id: string;
};

export type WaveBuoySiteFeature = {
  type: 'Feature';
  properties: WaveBuoySiteProperties;
  geometry: BuoyPoint;
};

export type WaveBuoySiteFeatureCollection = {
  type: 'FeatureCollection';
  features: WaveBuoySiteFeature[];
};
