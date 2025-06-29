import { SeriesData } from '@/components';

// Wave Buoy Details Types
export type BuoyDataVariants =
  | 'WPPE'
  | 'WPDS'
  | 'WPDI'
  | 'SSWMD'
  | 'WAVE_quality_control'
  | 'WMDS'
  | 'WPFM'
  | 'WSSH';

type BuoyItemContent<T> = {
  name: T;
  data: SeriesData['data'];
};

type BuouyItem<T extends string> = Record<T, BuoyItemContent<T>>;

type WaveBuoyDetailsProperties = BuouyItem<BuoyDataVariants> & {
  date: string;
  location: string;
  recourds_count: number;
  time_range: {
    start: string;
    end: string;
  };
};

export type WaveBuoyGeometry = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
};

export type WaveBuoyDetailsFeature = {
  type: 'Feature';
  properties: WaveBuoyDetailsProperties;
  geometry: WaveBuoyGeometry;
};

export type WaveBuoyDetailsMetaData = {
  date: string;
  description: string;
  generated_at: string;
  location: string;
  type: string;
};

export type WaveBuoyDetailsFeatureCollection = {
  type: 'FeatureCollection';
  features: WaveBuoyDetailsFeature[];
  metadata: WaveBuoyDetailsMetaData;
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
