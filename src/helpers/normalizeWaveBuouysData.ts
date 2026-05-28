import type { WaveBuoyPositionFeature, WaveBuoyPositionFeatureCollection } from '@/types';
import { utcToLocalDateTime } from '@/utils';
import type { GeoJSONFeature } from 'mapbox-gl';

export function normalizeWaveBuoyDates(
  collection: WaveBuoyPositionFeatureCollection,
): WaveBuoyPositionFeatureCollection {
  return {
    ...collection,
    features: collection.features.map(f => ({
      ...f,
      properties: { ...f.properties, date: utcToLocalDateTime(f.properties.date, 'YYYY-MM-DD') },
    })),
  };
}

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
    buoy: waveBuoys[0].properties.buoy,
  };
}
