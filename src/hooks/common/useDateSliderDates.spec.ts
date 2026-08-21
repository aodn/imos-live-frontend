// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type * as UtilsModule from '@/utils';

// Fix the selectable range to Jan 1–5 2025 (endDate is exclusive → Jan 6) and
// make the store's `date` controllable, so the clamping logic is deterministic.
// The real date utils (toUTCDate/addTime/toISODateString) are used unmocked;
// only formatUtcInstant is stubbed so "today" doesn't leak into the test.
const store = vi.hoisted(() => ({ date: '2025-01-03', timezone: 'UTC' as const }));

vi.mock('@/constants/mapInitialState', () => ({
  DATE_RANGE: { start: '2025-01-01', end: '2025-01-05' },
}));
vi.mock('@/store', () => ({
  useMapUIStore: (selector: (s: typeof store) => unknown) => selector(store),
}));
vi.mock('@/utils', async importOriginal => {
  const actual = await importOriginal<typeof UtilsModule>();
  return {
    ...actual,
    formatUtcInstant: () => '2025-01-05',
  };
});

import { useDateSliderDates } from './useDateSliderDates';

describe('useDateSliderDates', () => {
  afterEach(() => {
    store.date = '2025-01-03';
  });

  it('exposes the naive range start and the exclusive end (last day + 1)', () => {
    const { result } = renderHook(() => useDateSliderDates());
    expect(result.current.startDate).toBe('2025-01-01');
    expect(result.current.endDate).toBe('2025-01-06');
  });

  it('passes an in-range date through unchanged', () => {
    store.date = '2025-01-03';
    const { result } = renderHook(() => useDateSliderDates());
    expect(result.current.date).toBe('2025-01-03');
  });

  it('keeps the inclusive boundaries (first day and last day) in range', () => {
    store.date = '2025-01-01';
    expect(renderHook(() => useDateSliderDates()).result.current.date).toBe('2025-01-01');

    store.date = '2025-01-05';
    expect(renderHook(() => useDateSliderDates()).result.current.date).toBe('2025-01-05');
  });

  it('clamps a date before the range to the last selectable day', () => {
    store.date = '2024-12-01';
    expect(renderHook(() => useDateSliderDates()).result.current.date).toBe('2025-01-05');
  });

  it('clamps a date at/after the exclusive end to the last selectable day', () => {
    store.date = '2025-02-01';
    expect(renderHook(() => useDateSliderDates()).result.current.date).toBe('2025-01-05');
  });
});
