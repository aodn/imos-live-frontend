// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScales } from './useScales';

describe('useScales', () => {
  it('returns totalScaleUnits matching getTotalScales for the unit', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-05T00:00:00Z');
    const { result } = renderHook(() => useScales({ startDate, endDate, timeUnit: 'day' }));
    // 4 days span → ceil(96h/24) = 4
    expect(result.current.totalScaleUnits).toBe(4);
  });

  it('returns one scale per generated unit plus a synthetic end-of-range entry when needed', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-05T00:00:00Z');
    const { result } = renderHook(() => useScales({ startDate, endDate, timeUnit: 'day' }));
    expect(result.current.allScales.length).toBeGreaterThan(0);
    expect(result.current.allScales[0].position).toBe(0);
    expect(result.current.allScales[result.current.allScales.length - 1].position).toBe(100);
  });

  it('totals the per-type counts to match the number of scales', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-31T00:00:00Z');
    const { result } = renderHook(() => useScales({ startDate, endDate, timeUnit: 'day' }));
    const { short, medium, long } = result.current.numberOfScales;
    expect(short + medium + long).toBe(result.current.allScales.length);
  });

  it('returns stable references when inputs do not change (memoization)', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-05T00:00:00Z');
    const { result, rerender } = renderHook(props => useScales(props), {
      initialProps: { startDate, endDate, timeUnit: 'day' as const },
    });
    const firstScales = result.current.allScales;
    rerender({ startDate, endDate, timeUnit: 'day' });
    expect(result.current.allScales).toBe(firstScales);
  });

  it('honors a custom scaleTypeResolver', () => {
    const startDate = new Date('2026-01-01T00:00:00Z');
    const endDate = new Date('2026-01-04T00:00:00Z');
    const { result } = renderHook(() =>
      useScales({ startDate, endDate, timeUnit: 'day', scaleTypeResolver: () => 'long' }),
    );
    // All generated scales should be 'long' (the synthetic end-of-range entry is short).
    expect(result.current.allScales.slice(0, -1).every(s => s.type === 'long')).toBe(true);
  });
});
