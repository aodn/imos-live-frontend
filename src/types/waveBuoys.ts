// Wave Buoy Details Types
export type BuoyDataVariants = 'SSWMD' | 'WPFM' | 'WSSH';

export type BuoyItemContent = {
  data: [number, number][];
};

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

//Wave Buoy Position Types
export type WaveBuoyPositionMetaData = {
  date: string;
  buoy_count: number;
  generated_at: string;
};

export type WaveBuoyPositionProperties = {
  date: string;
  buoy: string;
  year: number;
  timestap: string;
};

export type WaveBuoyPositionFeature = {
  type: 'Feature';
  properties: WaveBuoyPositionProperties;
  geometry: WaveBuoyGeometry;
};

export type WaveBuoyPositionFeatureCollection = {
  type: 'FeatureCollection';
  features: WaveBuoyPositionFeature[];
  metadata: WaveBuoyPositionMetaData;
};
