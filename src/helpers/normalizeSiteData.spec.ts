import { describe, expect, it } from 'vitest';
import type { GeoJSONFeature } from 'mapbox-gl';
import type { SiteFeatureCollection } from '@/types';
import { normalizeSiteDates, normalizeSitesData, toSiteChartData } from './normalizeSiteData';

function featureCollection(
  entries: { date: string; site: string; coords?: [number, number] }[],
): SiteFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: entries.map(({ date, site, coords = [150, -30] }) => ({
      type: 'Feature',
      properties: { date, site, _id: `${site}-id` },
      geometry: { type: 'Point', coordinates: coords },
    })),
  };
}

describe('normalizeSiteDates', () => {
  it('reformats each feature date as YYYY-MM-DD', () => {
    const fc = featureCollection([{ date: '2026-05-29T00:00:00Z', site: 'A' }]);
    const result = normalizeSiteDates(fc);
    expect(result.features[0].properties.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('preserves the rest of the feature shape', () => {
    const fc = featureCollection([{ date: '2026-05-29T00:00:00Z', site: 'HOBARITO' }]);
    const result = normalizeSiteDates(fc);
    expect(result.type).toBe('FeatureCollection');
    expect(result.features[0].properties.site).toBe('HOBARITO');
    expect(result.features[0].geometry.coordinates).toEqual([150, -30]);
  });
});

describe('normalizeSitesData', () => {
  it('strips the type field while preserving properties and geometry', () => {
    const fc = featureCollection([{ date: '2026-05-29', site: 'A' }]);
    const result = normalizeSitesData(fc.features as unknown as GeoJSONFeature[]);
    expect(result[0]).not.toHaveProperty('type');
    expect(result[0].properties.site).toBe('A');
    expect(result[0].geometry.coordinates).toEqual([150, -30]);
  });
});

describe('toSiteChartData', () => {
  it('extracts the first feature into a chart-ready record', () => {
    const fc = featureCollection([
      { date: '2026-05-29', site: 'HOBARITO', coords: [147.33, -42.88] },
      { date: '2026-05-30', site: 'DARWIN' },
    ]);
    const result = toSiteChartData(normalizeSitesData(fc.features as unknown as GeoJSONFeature[]));
    expect(result.site).toBe('HOBARITO');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.geometry.coordinates).toEqual([147.33, -42.88]);
  });

  it('throws when given an empty array', () => {
    expect(() => toSiteChartData([])).toThrow('at least one feature');
  });
});
