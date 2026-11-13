import { describe, expect, it } from 'vitest';
import type { ProductManifest } from '@/AtlasRenderingSystem';
import { formatLegendLabel, getManifestUnit } from './legendLabel';

function manifest(overrides: Partial<ProductManifest>): ProductManifest {
  return { bounds: { lonMin: 0, lonMax: 1, latMin: 0, latMax: 1 }, lods: {}, ...overrides };
}

describe('getManifestUnit', () => {
  it('returns valueUnit for scalar products', () => {
    expect(getManifestUnit(manifest({ valueUnit: 'degrees Celsius' }))).toBe('degrees Celsius');
  });

  it('returns the shared u/v unit for particle products', () => {
    expect(getManifestUnit(manifest({ uUnit: 'm/s', vUnit: 'm/s' }))).toBe('m/s');
  });

  it('returns undefined when u/v units disagree', () => {
    expect(getManifestUnit(manifest({ uUnit: 'm/s', vUnit: 'cm/s' }))).toBeUndefined();
  });

  it('returns undefined when the manifest has no unit (e.g. categorical)', () => {
    expect(getManifestUnit(manifest({ flagValues: [0, 1] }))).toBeUndefined();
  });
});

describe('formatLegendLabel', () => {
  it('appends the unit in parentheses', () => {
    expect(formatLegendLabel('sea level anomaly', 'm')).toBe('sea level anomaly (m)');
  });

  it('returns the bare label without a unit', () => {
    expect(formatLegendLabel('MHW category')).toBe('MHW category');
  });
});
