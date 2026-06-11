import type { RawSiteFeatureCollection, SiteFeature } from '@/types';
import { utcToLocalDateTime } from '@/utils';
import type { GeoJSONFeature } from 'mapbox-gl';

export function normalizeWaveBuoyDates(
  collection: RawSiteFeatureCollection,
): RawSiteFeatureCollection {
  return {
    ...collection,
    features: collection.features.map(f => ({
      ...f,
      properties: { ...f.properties, date: utcToLocalDateTime(f.properties.date, 'YYYY-MM-DD') },
    })),
  };
}

export function normalizeWaveBuoysData(features: GeoJSONFeature[]): Omit<SiteFeature, 'type'>[] {
  return features.map(f => ({
    geometry: f.geometry as SiteFeature['geometry'],
    properties: f.properties as SiteFeature['properties'],
  }));
}

type WaveBuoyData = {
  date: Date;
  geometry: SiteFeature['geometry'];
  buoy: string;
};

export function toWaveBuoyChartData(waveBuoys: Omit<SiteFeature, 'type'>[]): WaveBuoyData {
  if (waveBuoys.length === 0) {
    throw new Error('waveBuoys must contain at least one feature');
  }

  return {
    geometry: waveBuoys[0].geometry,
    date: new Date(waveBuoys[0].properties.date),
    buoy: waveBuoys[0].properties.buoy || '',
  };
}
