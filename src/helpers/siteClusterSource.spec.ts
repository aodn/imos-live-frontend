import { PRODUCT } from '@/constants';
import type { RawSiteFeature } from '@/types';
import { describe, expect, it } from 'vitest';
import { combineSiteFeatures } from './siteClusterSource';

function feature(site: string) {
  return {
    type: 'Feature',
    properties: { site },
    geometry: { type: 'Point', coordinates: [150, -30] },
  } as unknown as RawSiteFeature;
}

describe('combineSiteFeatures', () => {
  it('merges all products into one list and tags each feature with its product', () => {
    const result = combineSiteFeatures(
      new Map([
        [PRODUCT.MOORING_TIMESERIES_REALTIME, [feature('mooring')]],
        [PRODUCT.WAVE_BUOYS, [feature('buoy')]],
      ]),
    );

    expect(result.map(f => [f.properties.site, f.properties.product])).toEqual([
      ['buoy', PRODUCT.WAVE_BUOYS],
      ['mooring', PRODUCT.MOORING_TIMESERIES_REALTIME],
    ]);
  });

  it("keeps a site's _id when other products load or unload", () => {
    const mooring = [feature('NRSKAI')];
    const idOf = (byProduct: Parameters<typeof combineSiteFeatures>[0]) =>
      combineSiteFeatures(byProduct).find(f => f.properties.site === 'NRSKAI')?.properties._id;

    const alone = idOf(new Map([[PRODUCT.MOORING_TIMESERIES_REALTIME, mooring]]));
    const withBuoys = idOf(
      new Map([
        [PRODUCT.WAVE_BUOYS, [feature('buoy-a'), feature('buoy-b')]],
        [PRODUCT.MOORING_TIMESERIES_REALTIME, mooring],
      ]),
    );

    expect(alone).toBe(`${PRODUCT.MOORING_TIMESERIES_REALTIME}:NRSKAI`);
    expect(withBuoys).toBe(alone);
  });

  it('gives same-named sites of different products distinct ids', () => {
    const result = combineSiteFeatures(
      new Map([
        [PRODUCT.WAVE_BUOYS, [feature('SAME')]],
        [PRODUCT.MOORING_TIMESERIES_REALTIME, [feature('SAME')]],
      ]),
    );
    expect(new Set(result.map(f => f.properties._id)).size).toBe(2);
  });

  it('does not mutate the input features', () => {
    const input = feature('buoy');
    combineSiteFeatures(new Map([[PRODUCT.WAVE_BUOYS, [input]]]));
    expect(input.properties).not.toHaveProperty('product');
  });
});
