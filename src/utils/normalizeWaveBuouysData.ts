import { WaveBuoyOgcFeature } from '@/types';
import { GeoJSONFeature } from 'mapbox-gl';

export function normalizeWaveBuouysData(
  features: GeoJSONFeature[],
): Omit<WaveBuoyOgcFeature, 'type'>[] {
  return features.map(f => ({
    geometry: f.geometry as WaveBuoyOgcFeature['geometry'],
    properties: f.properties as WaveBuoyOgcFeature['properties'],
  }));
}

type WaveBuoyData = {
  data: { x: number; y: number }[];
  geometry: WaveBuoyOgcFeature['geometry'];
};

export function toWaveBuoyChartData(waveBuoys: Omit<WaveBuoyOgcFeature, 'type'>[]): WaveBuoyData {
  if (waveBuoys.length === 0) {
    throw new Error('waveBuoys must contain at least one feature');
  }

  return {
    geometry: waveBuoys[0].geometry,
    data: waveBuoys
      .map(w => ({
        x: new Date(w.properties.date).getTime(),
        y: w.properties.count,
      }))
      .sort((a, b) => a.x - b.x),
  };
}
