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

  it('does not mutate the input features', () => {
    const input = feature('buoy');
    combineSiteFeatures(new Map([[PRODUCT.WAVE_BUOYS, [input]]]));
    expect(input.properties).not.toHaveProperty('product');
  });
});
