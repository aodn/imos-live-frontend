// @vitest-environment jsdom
// jsdom is required because the store uses zustand's `persist` middleware with
// a URL-based storage adapter that reads `location.href` / `window.history` at
// module init.

import { beforeEach, describe, expect, it } from 'vitest';
import { PRODUCT, PRODUCTLEGENDS, SCALAR_TILES_GROUP } from '@/constants';
import type { TilesProduct } from '@/constants';
import { getProductLegend, useMapUIStore } from './useMapUIStore';

// Snapshot the initial store state so each test starts from a known baseline.
// Zustand stores live for the lifetime of the module, so we have to reset
// rather than re-import.
const INITIAL_STATE = useMapUIStore.getState();

beforeEach(() => {
  useMapUIStore.setState(INITIAL_STATE, true);
});

describe('product enabled state', () => {
  it('GSLA current, GSLA anomaly sea levels, and Wave Buoys are enabled by default; the heatwave scalar products are not', () => {
    const { productEnabled } = useMapUIStore.getState();
    expect(productEnabled[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]).toBe(true);
    expect(productEnabled[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]).toBe(true);
    expect(productEnabled[PRODUCT.WAVE_BUOYS]).toBe(true);
    expect(productEnabled[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]).toBe(false);
    expect(productEnabled[PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]).toBe(false);
    expect(productEnabled[PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]).toBe(false);
  });

  it('toggling a non-SCALAR_TILES_GROUP product leaves others untouched', () => {
    const { setProductEnabledByProduct } = useMapUIStore.getState();
    setProductEnabledByProduct(PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT, true);

    const after = useMapUIStore.getState().productEnabled;
    expect(after[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]).toBe(true);
    expect(after[PRODUCT.WAVE_BUOYS]).toBe(true);
  });

  it('enabling a SCALAR_TILES_GROUP product disables every other tile product (mutually exclusive)', () => {
    const { setProductEnabledByProduct } = useMapUIStore.getState();
    // First turn on SST mosaic, then switch to MCS category — only the latter should remain on.
    setProductEnabledByProduct(PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC, true);
    setProductEnabledByProduct(PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY, true);

    const after = useMapUIStore.getState().productEnabled;
    expect(after[PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY]).toBe(true);
    expect(after[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]).toBe(false);
    expect(after[PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC]).toBe(false);
    expect(after[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]).toBe(false);
  });

  it('disabling a SCALAR_TILES_GROUP product clears it without enabling others', () => {
    const { setProductEnabledByProduct } = useMapUIStore.getState();
    setProductEnabledByProduct(PRODUCT.GSLA_ANOMALY_SEA_LEVELS, true);
    setProductEnabledByProduct(PRODUCT.GSLA_ANOMALY_SEA_LEVELS, false);

    const after = useMapUIStore.getState().productEnabled;
    for (const p of SCALAR_TILES_GROUP) {
      expect(after[p]).toBe(false);
    }
  });

  it('does not mutate the previous productEnabled object', () => {
    const before = useMapUIStore.getState().productEnabled;
    useMapUIStore.getState().setProductEnabledByProduct(PRODUCT.WAVE_BUOYS, false);
    const after = useMapUIStore.getState().productEnabled;
    expect(after).not.toBe(before);
    expect(before[PRODUCT.WAVE_BUOYS]).toBe(true); // unchanged
  });
});

describe('product error / loading flags', () => {
  it('tracks error per product without touching siblings', () => {
    useMapUIStore.getState().setProductErrorByProduct(PRODUCT.WAVE_BUOYS, true);
    const { productError } = useMapUIStore.getState();
    expect(productError[PRODUCT.WAVE_BUOYS]).toBe(true);
    expect(productError[PRODUCT.GSLA_ANOMALY_SEA_LEVELS]).toBe(false);
  });

  it('tracks loading per product without touching siblings', () => {
    useMapUIStore.getState().setProductLoadingByProduct(PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC, true);
    const { productLoading } = useMapUIStore.getState();
    expect(productLoading[PRODUCT.AUSTEMP_HEATWAVE_SST_MOSAIC]).toBe(true);
    expect(productLoading[PRODUCT.WAVE_BUOYS]).toBe(false);
  });
});

describe('product legends', () => {
  it('seeds productLegends from PRODUCTLEGENDS', () => {
    const legends = useMapUIStore.getState().productLegends;
    expect(legends[PRODUCT.GSLA_ANOMALY_SEA_LEVELS as TilesProduct].label).toBe(
      PRODUCTLEGENDS[PRODUCT.GSLA_ANOMALY_SEA_LEVELS].label,
    );
  });

  it('setProductLegend partial-merges into the existing legend', () => {
    const product = PRODUCT.GSLA_ANOMALY_SEA_LEVELS as TilesProduct;
    const original = useMapUIStore.getState().productLegends[product];
    useMapUIStore.getState().setProductLegend(product, { range: [-2, 2] });
    const updated = useMapUIStore.getState().productLegends[product];
    expect(updated.range).toEqual([-2, 2]);
    // Other fields preserved.
    expect(updated.label).toBe(original.label);
    expect(updated.colorKey).toBe(original.colorKey);
    expect(updated.scale).toBe(original.scale);
  });

  it('getProductLegend reflects the latest set', () => {
    const product = PRODUCT.AUSTEMP_HEATWAVE_SSTA_MOSAIC as TilesProduct;
    useMapUIStore.getState().setProductLegend(product, { range: [-3, 3] });
    expect(getProductLegend(product).range).toEqual([-3, 3]);
  });
});

describe('jumpToDate', () => {
  it('is null by default', () => {
    expect(useMapUIStore.getState().jumpToDate).toBeNull();
  });

  it('setJumpToDate stamps a fresh trigger each call', async () => {
    useMapUIStore.getState().setJumpToDate('2026-05-29');
    const first = useMapUIStore.getState().jumpToDate;
    expect(first?.date).toBe('2026-05-29');
    expect(typeof first?.trigger).toBe('number');

    // Wait long enough to guarantee Date.now() advances past the millisecond.
    await new Promise(r => setTimeout(r, 2));

    useMapUIStore.getState().setJumpToDate('2026-05-29');
    const second = useMapUIStore.getState().jumpToDate;
    expect(second?.trigger).not.toBe(first?.trigger);
  });

  it('clearJumpToDate resets to null', () => {
    useMapUIStore.getState().setJumpToDate('2026-05-29');
    useMapUIStore.getState().clearJumpToDate();
    expect(useMapUIStore.getState().jumpToDate).toBeNull();
  });
});

describe('miscellaneous setters', () => {
  it('setDate updates the date field', () => {
    useMapUIStore.getState().setDate('2026-05-29');
    expect(useMapUIStore.getState().date).toBe('2026-05-29');
  });

  it('setDistanceMeasurementEnabled toggles the flag', () => {
    useMapUIStore.getState().setDistanceMeasurementEnabled(true);
    expect(useMapUIStore.getState().distanceMeasurementEnabled).toBe(true);
  });

  it('setParticleConfig merges into the existing config', () => {
    const before = useMapUIStore.getState().particleConfig;
    useMapUIStore.getState().setParticleConfig({ speedFactor: 99 });
    const after = useMapUIStore.getState().particleConfig;
    expect(after.speedFactor).toBe(99);
    // Other particle fields preserved.
    expect(after.nParticles).toBe(before.nParticles);
  });
});

describe('URL sync carries only non-default state', () => {
  it('omits params equal to the initial state', () => {
    // beforeEach reset the store to its initial state, which clears the URL.
    const params = new URLSearchParams(location.search);
    expect(params.has('zoom')).toBe(false);
    expect(params.has('productEnabled')).toBe(false);
  });

  it('writes a param once it differs from initial, then drops it on reset', () => {
    useMapUIStore.getState().setZoom(INITIAL_STATE.zoom + 4);
    expect(new URLSearchParams(location.search).get('zoom')).toBe(String(INITIAL_STATE.zoom + 4));

    useMapUIStore.getState().setZoom(INITIAL_STATE.zoom);
    expect(new URLSearchParams(location.search).has('zoom')).toBe(false);
  });

  it('always keeps date in the URL, even when it equals the initial date', () => {
    // date is exempt from default-omit: its absence means "jump to latest", so a
    // shared link must carry it even when it happens to equal INITIAL_DATE.
    useMapUIStore.getState().setDate(INITIAL_STATE.date);
    expect(new URLSearchParams(location.search).get('date')).toBe(INITIAL_STATE.date);
  });
});
