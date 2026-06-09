// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { usePositionState } from './usePositionState';

const startDate = new Date('2026-01-01T00:00:00Z');

describe('usePositionState', () => {
  it('defaults to rangeStart=0, rangeEnd=100, point=50 when no initial values', () => {
    const { result } = renderHook(() =>
      usePositionState(undefined, undefined, startDate, 'day', 10),
    );
    expect(result.current.rangeStartPosition).toBe(0);
    expect(result.current.rangeEndPosition).toBe(100);
    expect(result.current.pointPosition).toBe(50);
  });

  it('computes initial point position from initialPoint', () => {
    // Jan 5 → getTotalScales(Jan 1, Jan 5) = ceil(96h/24) = 4 days → 4/10 = 40%
    const { result } = renderHook(() =>
      usePositionState(undefined, new Date('2026-01-05T00:00:00Z'), startDate, 'day', 10),
    );
    expect(result.current.pointPosition).toBe(40);
  });

  it('computes initial range positions from initialRange', () => {
    // Jan 2 → 1/10 = 10%, Jan 8 → 7/10 = 70%
    const { result } = renderHook(() =>
      usePositionState(
        { start: new Date('2026-01-02T00:00:00Z'), end: new Date('2026-01-08T00:00:00Z') },
        undefined,
        startDate,
        'day',
        10,
      ),
    );
    expect(result.current.rangeStartPosition).toBe(10);
    expect(result.current.rangeEndPosition).toBe(70);
  });

  it('clamps initial positions to [0, 100]', () => {
    const { result } = renderHook(() =>
      usePositionState(
        undefined,
        new Date('2027-01-01T00:00:00Z'), // way beyond 10 days
        startDate,
        'day',
        10,
      ),
    );
    expect(result.current.pointPosition).toBe(100);
  });

  it('updates ref values when state changes', () => {
    const { result } = renderHook(() =>
      usePositionState(undefined, undefined, startDate, 'day', 10),
    );
    act(() => result.current.setPointPosition(75));
    expect(result.current.pointPositionRef.current).toBe(75);

    act(() => result.current.setRangeStartPosition(10));
    expect(result.current.rangeStartRef.current).toBe(10);

    act(() => result.current.setRangeEndPosition(90));
    expect(result.current.rangeEndRef.current).toBe(90);
  });
});
