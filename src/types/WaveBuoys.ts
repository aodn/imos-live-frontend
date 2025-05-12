export interface WaveBuoyProperties {
  FID: string;
  file_id: number;
  url: string;
  size: number;
  institution: string;
  institut_for_filter: string;
  site_name: string;
  instrument: string;
  wave_buoy_type: string;
  platform: string;
  water_depth: number | null;
  time_start: string;
  time_end: string;
  latitude_min: number;
  longitude_min: number;
  TIME: string;
  significant_wave_height: number | null;
  wave_mean_period: number | null;
  peak_wave_direction: number | null;
  peak_wave_period: number | null;
}

export interface WaveBuoyGeometry {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface WaveBuoyFeature {
  type: 'Feature';
  properties: WaveBuoyProperties;
  geometry: WaveBuoyGeometry;
}

export interface WaveBuoyFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  crs: {
    type: 'name';
    properties: {
      name: string;
    };
  };
  features: WaveBuoyFeature[];
}
