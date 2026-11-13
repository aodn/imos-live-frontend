import { afterEach, describe, expect, it, vi } from 'vitest';
import { COLOR_OPTIONS, PRODUCT, PRODUCTLEGENDS } from '@/constants';
import type { ProductManifest } from '@/AtlasRenderingSystem';
import { validateCategoricalManifest } from './validateCategoricalManifest';

const MHW = PRODUCT.AUSTEMP_HEATWAVE_MHW_CATEGORY_MOSAIC;
const numColors = COLOR_OPTIONS[PRODUCTLEGENDS[MHW].colorKey].length;

function manifest(overrides: Partial<ProductManifest>): ProductManifest {
  return {
    bounds: { lonMin: 0, lonMax: 1, latMin: 0, latMax: 1 },
    lods: {},
    ...overrides,
  };
}

describe('validateCategoricalManifest', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  afterEach(() => warn.mockClear());

  it('stays silent for consecutive flags starting at valueRange[0]', () => {
    const flagValues = Array.from({ length: numColors }, (_, i) => i);
    validateCategoricalManifest(MHW, manifest({ flagValues, valueRange: [0, numColors - 1] }));
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns when flags are offset from valueRange[0]', () => {
    const flagValues = Array.from({ length: numColors }, (_, i) => i + 1);
    validateCategoricalManifest(MHW, manifest({ flagValues, valueRange: [0, numColors] }));
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/not consecutive integers/);
  });

  it('warns when flags have gaps', () => {
    const flagValues = Array.from({ length: numColors }, (_, i) => i * 2);
    validateCategoricalManifest(
      MHW,
      manifest({ flagValues, valueRange: [0, (numColors - 1) * 2] }),
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/not consecutive integers/);
  });

  it('warns when the palette length differs from flag_values', () => {
    const flagValues = Array.from({ length: numColors + 1 }, (_, i) => i);
    validateCategoricalManifest(MHW, manifest({ flagValues, valueRange: [0, numColors] }));
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toMatch(/colours but manifest flag_values/);
  });

  it('ignores continuous products', () => {
    validateCategoricalManifest(
      PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC,
      manifest({ flagValues: [5, 9], valueRange: [0, 40] }),
    );
    expect(warn).not.toHaveBeenCalled();
  });
});
