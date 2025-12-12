// Wave Buoy Details Types
export type BuoyDataVariants = 'SSWMD' | 'WPFM' | 'WSSH' | 'WHTH' | 'WPMH';

export type BuoyItemContent = [number, number][];

export type BuouyItem = Record<BuoyDataVariants, BuoyItemContent>;

export type WaveBuoyGeometry = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export type WaveBuoyDetailsFeature = {
  type: 'Feature';
  properties: BuouyItem;
  geometry: WaveBuoyGeometry;
};

export type WaveBuoyDetailsFeatureCollection = {
  type: 'FeatureCollection';
  features: WaveBuoyDetailsFeature[];
};

export type WaveBuoyPositionProperties = {
  date: string;
  buoy: string;
  _id: string;
};

export type WaveBuoyPositionFeature = {
  type: 'Feature';
  properties: WaveBuoyPositionProperties;
  geometry: WaveBuoyGeometry;
};

export type WaveBuoyPositionFeatureCollection = {
  type: 'FeatureCollection';
  features: WaveBuoyPositionFeature[];
};
