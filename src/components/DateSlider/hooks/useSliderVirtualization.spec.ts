// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSliderVirtualization } from './useSliderVirtualization';
import type { Scale } from '../type';

const makeScales = (positions: number[]): Scale[] =>
  positions.map(position => ({
    position,
    type: 'short',
    date: new Date('2026-01-01T00:00:00Z'),
  }));

describe('useSliderVirtualization', () => {
  it('returns all scales when scrolling is disabled', () => {
    const allScales = makeScales([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    const { result } = renderHook(() =>
      useSliderVirtualization({
        behavior: { scrollable: false },
        trackWidth: 4000,
        sliderContainerWidth: 1000,
        sliderPositionX: 0,
        allScales,
      }),
    );
    expect(result.current.scales).toBe(allScales);
  });

  it('returns all scales when trackWidth fits in container (no virtualization needed)', () => {
    const allScales = makeScales([0, 25, 50, 75, 100]);
    const { result } = renderHook(() =>
      useSliderVirtualization({
        behavior: { scrollable: true },
        trackWidth: 500,
        sliderContainerWidth: 1000,
        sliderPositionX: 0,
        allScales,
      }),
    );
    expect(result.current.scales).toBe(allScales);
  });

  it('filters out scales outside the buffered visible range', () => {
    const allScales = makeScales([0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
    // sliderPositionX=-500/trackWidth=4000 → scrollLeft=12.5%, viewport=25%
    // buffered: start=max(0,12.5-12.5)=0, end=min(100,37.5+12.5)=50
    const { result } = renderHook(() =>
      useSliderVirtualization({
        behavior: { scrollable: true },
        trackWidth: 4000,
        sliderContainerWidth: 1000,
        sliderPositionX: -500,
        allScales,
      }),
    );
    expect(result.current.scales.every(s => s.position >= 0 && s.position <= 50)).toBe(true);
    expect(result.current.scales.length).toBeLessThan(allScales.length);
  });

  it('memoizes when inputs are unchanged', () => {
    const allScales = makeScales([0, 25, 50, 75, 100]);
    const { result, rerender } = renderHook(props => useSliderVirtualization(props), {
      initialProps: {
        behavior: { scrollable: true },
        trackWidth: 4000,
        sliderContainerWidth: 1000,
        sliderPositionX: -500,
        allScales,
      },
    });
    const firstScales = result.current.scales;
    rerender({
      behavior: { scrollable: true },
      trackWidth: 4000,
      sliderContainerWidth: 1000,
      sliderPositionX: -500,
      allScales,
    });
    expect(result.current.scales).toBe(firstScales);
  });
});
