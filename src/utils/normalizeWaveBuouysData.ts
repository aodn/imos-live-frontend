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
  date: Date;
  geometry: WaveBuoyOgcFeature['geometry'];
};

export function toWaveBuoyChartData(waveBuoys: Omit<WaveBuoyOgcFeature, 'type'>[]): WaveBuoyData {
  if (waveBuoys.length === 0) {
    throw new Error('waveBuoys must contain at least one feature');
  }
  //this needs to be revised, because after enable clustering, each point is plotted from
  //one point in geojson. And this function should generate data has one coordinate and one date,
  //then we can use this date and coordinate to query from endpoint or other ways to get
  //detailed data that need to be displayed in highchart.
  return {
    geometry: waveBuoys[0].geometry,
    date: new Date(waveBuoys[0].properties.date),
  };
}
