import { describe, expect, it } from 'vitest';
import { COLOR_OPTIONS } from '@/constants';
import { buildProductPalette, getLegendRange } from './buildProductPalette';

describe('buildProductPalette', () => {
  it('selects the palette referenced by colorKey', () => {
    const palette = buildProductPalette({
      label: 'test',
      colorKey: 'RdBu_r',
      colorKeyOptions: ['RdBu_r'],
      range: [-1, 1],
      scale: 'linear',
    });
    expect(palette.rawColors).toBe(COLOR_OPTIONS.RdBu_r);
  });

  it('preserves scale and range on the resulting palette', () => {
    const palette = buildProductPalette({
      label: 'test',
      colorKey: 'Classic Rainbow',
      colorKeyOptions: ['Classic Rainbow'],
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
      colorKeyOptions: ['Ocean to Terrain'],
      range: [0.01, 3],
      scale: 'log',
    });
    expect(palette.scale).toBe('log');
    expect(palette.legendRange).toEqual([0.01, 3]);
  });

  it('gives category legends an inert placeholder range', () => {
    const palette = buildProductPalette({
      label: 'categories',
      colorKey: 'MHW_CATEGORY_LEGEND_COLORS',
      colorKeyOptions: ['MHW_CATEGORY_LEGEND_COLORS'],
      scale: 'category',
    });
    expect(palette.scale).toBe('category');
    expect(palette.legendRange).toEqual([0, 1]);
  });

  it("getLegendRange returns a continuous legend's own range", () => {
    expect(
      getLegendRange({
        label: 'test',
        colorKey: 'RdBu_r',
        colorKeyOptions: ['RdBu_r'],
        range: [-4, 4],
        scale: 'linear',
      }),
    ).toEqual([-4, 4]);
  });
});
