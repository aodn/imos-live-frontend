import { describe, expect, it } from 'vitest';
import { PRODUCT } from '@/constants';
import { deserialize, serialize } from './serialization';

describe('per-key round-trip', () => {
  const cases: { key: string; value: unknown }[] = [
    { key: 'center', value: { lng: 133.7751, lat: -25.2744 } },
    { key: 'zoom', value: 3 },
    { key: 'zoom', value: 5.5 },
    { key: 'style', value: 'Streets' },
    { key: 'date', value: '2026-05-31' },
    { key: 'worldBoundariesEnabled', value: true },
    { key: 'worldBoundariesEnabled', value: false },
    {
      key: 'particleConfig',
      value: {
        nParticles: 30000,
        fadeOpacity: 0.98,
        speedFactor: 4.5,
        dropRate: 0.002,
        dropRateBump: 0.05,
        pointSize: 0.9,
      },
    },
    {
      key: 'productEnabled',
      value: {
        [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: true,
        [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: true,
        [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: false,
        [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: false,
        [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: false,
        [PRODUCT.WAVE_BUOYS]: true,
        [PRODUCT.MOORING_TIMESERIES_REALTIME]: false,
      },
    },
  ];

  for (const { key, value } of cases) {
    it(`preserves ${key}: ${JSON.stringify(value)}`, () => {
      expect(deserialize(serialize(value, key), key)).toEqual(value);
    });
  }
});

describe('compact output format (no type tags, no JSON noise)', () => {
  it('writes center as lng*lat', () => {
    expect(serialize({ lng: 133.7751, lat: -25.2744 }, 'center')).toBe('133.7751*-25.2744');
  });

  it('writes numbers and strings bare', () => {
    expect(serialize(3, 'zoom')).toBe('3');
    expect(serialize('Streets', 'style')).toBe('Streets');
  });

  it('writes booleans as 1/0', () => {
    expect(serialize(true, 'worldBoundariesEnabled')).toBe('1');
    expect(serialize(false, 'worldBoundariesEnabled')).toBe('0');
  });

  it('writes particleConfig as *-joined values', () => {
    const config = {
      nParticles: 30000,
      fadeOpacity: 0.98,
      speedFactor: 4.5,
      dropRate: 0.002,
      dropRateBump: 0.05,
      pointSize: 0.9,
    };
    expect(serialize(config, 'particleConfig')).toBe('30000*0.98*4.5*0.002*0.05*0.9');
  });

  it('writes productEnabled as a bit string', () => {
    const enabled = {
      [PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]: true,
      [PRODUCT.GSLA_ANOMALY_SEA_LEVELS]: true,
      [PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]: false,
      [PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]: false,
      [PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC]: false,
      [PRODUCT.WAVE_BUOYS]: true,
      [PRODUCT.MOORING_TIMESERIES_REALTIME]: false,
    };
    expect(serialize(enabled, 'productEnabled')).toBe('1100010');
  });
});
