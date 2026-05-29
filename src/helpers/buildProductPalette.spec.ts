import { describe, expect, it } from 'vitest';
import { COLOR_OPTIONS } from '@/constants';
import { buildProductPalette } from './buildProductPalette';

describe('buildProductPalette', () => {
  it('selects the palette referenced by colorKey', () => {
    const palette = buildProductPalette({
      label: 'test',
      colorKey: 'RdBu_r',
      range: [-1, 1],
      scale: 'linear',
    });
    expect(palette.rawColors).toBe(COLOR_OPTIONS.RdBu_r);
  });

  it('preserves scale and range on the resulting palette', () => {
    const palette = buildProductPalette({
      label: 'test',
      colorKey: 'X Rainbow',
      range: [-1.2, 1.2],
      scale: 'linear',
    });
    expect(palette.scale).toBe('linear');
    expect(palette.legendRange).toEqual([-1.2, 1.2]);
  });

  it('passes log scale through', () => {
    const palette = buildProductPalette({
      label: 'particles',
      colorKey: 'Ocean to Terrain',
      range: [0.01, 3],
      scale: 'log',
    });
    expect(palette.scale).toBe('log');
    expect(palette.legendRange).toEqual([0.01, 3]);
  });
});
