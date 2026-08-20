import type { RawSiteFeatureCollection, SiteFeature } from '@/types';
import type { TIMEZONE } from '@/store';
import { formatUtcInstant } from '@/utils';
import type { GeoJSONFeature } from 'mapbox-gl';

export function normalizeSiteDates(
  collection: RawSiteFeatureCollection,
  timezone: TIMEZONE,
): RawSiteFeatureCollection {
  return {
    ...collection,
    features: collection.features.map(f => ({
      ...f,
      properties: {
        ...f.properties,
        date: formatUtcInstant(f.properties.date, timezone, 'YYYY-MM-DD'),
      },
    })),
  };
}

export function normalizeSitesData(features: GeoJSONFeature[]): Omit<SiteFeature, 'type'>[] {
  return features.map(f => ({
    geometry: f.geometry as SiteFeature['geometry'],
    properties: f.properties as SiteFeature['properties'],
  }));
}

type SiteData = {
  date: Date;
  geometry: SiteFeature['geometry'];
  site: string;
};

export function toSiteChartData(sites: Omit<SiteFeature, 'type'>[]): SiteData {
  if (sites.length === 0) {
    throw new Error('sites must contain at least one feature');
  }

  return {
    geometry: sites[0].geometry,
    date: new Date(sites[0].properties.date),
    site: sites[0].properties.site || '',
  };
}
