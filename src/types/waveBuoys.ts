import type { Point } from 'geojson';

// geojson's Point allows any-length `Position`; wave buoy points are always [lng, lat].
export type BuoyPoint = Point & { coordinates: [number, number] };

export type BuoyDataVariants = 'SSWMD' | 'WPFM' | 'WSSH' | 'WHTH' | 'WPMH';

export type BuoyItemContent = [number, number][];

export type BuouyItem = Record<BuoyDataVariants, BuoyItemContent>;

export type WaveBuoyDetailsFeature = {
  type: 'Feature';
  properties: BuouyItem;
  geometry: BuoyPoint;
};

export type WaveBuoyDetailsFeatureCollection = {
  type: 'FeatureCollection';
  features: WaveBuoyDetailsFeature[];
};

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
