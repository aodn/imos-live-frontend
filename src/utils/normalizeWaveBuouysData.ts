import { WaveBuoyPositionFeature } from '@/types';
import { GeoJSONFeature } from 'mapbox-gl';

export function normalizeWaveBuouysData(
  features: GeoJSONFeature[],
): Omit<WaveBuoyPositionFeature, 'type'>[] {
  return features.map(f => ({
    geometry: f.geometry as WaveBuoyPositionFeature['geometry'],
    properties: f.properties as WaveBuoyPositionFeature['properties'],
  }));
}

type WaveBuoyData = {
  date: Date;
  geometry: WaveBuoyPositionFeature['geometry'];
  dateString: string;
  buoy: string;
};

export function toWaveBuoyChartData(
  waveBuoys: Omit<WaveBuoyPositionFeature, 'type'>[],
): WaveBuoyData {
  if (waveBuoys.length === 0) {
    throw new Error('waveBuoys must contain at least one feature');
  }

  return {
    geometry: waveBuoys[0].geometry,
    date: new Date(waveBuoys[0].properties.date),
    dateString: waveBuoys[0].properties.date,
    buoy: waveBuoys[0].properties.buoy,
  };
}
