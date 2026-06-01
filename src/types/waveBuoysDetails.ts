import type { BuoyPoint } from './waveBuoysPoint';

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
