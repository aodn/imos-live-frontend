// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

// Fix the selectable range to Jan 1–5 2025 (endDate is exclusive → Jan 6) and
// make the store's `date` controllable, so the clamping logic is deterministic.
// The real date utils (toUTCDate/addTime/minusOneUTCDay) are used unmocked.
const store = vi.hoisted(() => ({ date: '2025-01-03' }));

vi.mock('@/constants', () => ({
  DATE_RANGE: { start: '2025-01-01', end: '2025-01-05' },
}));
vi.mock('@/store', () => ({
  useMapUIStore: (selector: (s: { date: string }) => unknown) => selector({ date: store.date }),
}));

import { useDateSliderDates } from './useDateSliderDates';

const iso = (d: Date) => d.toISOString();

describe('useDateSliderDates', () => {
  afterEach(() => {
    store.date = '2025-01-03';
  });

  it('exposes the range start and the exclusive end (last day + 1)', () => {
    const { result } = renderHook(() => useDateSliderDates());
    expect(iso(result.current.startDate)).toBe('2025-01-01T00:00:00.000Z');
    expect(iso(result.current.endDate)).toBe('2025-01-06T00:00:00.000Z');
  });

  it('passes an in-range date through unchanged', () => {
    store.date = '2025-01-03';
    const { result } = renderHook(() => useDateSliderDates());
    expect(iso(result.current.date)).toBe('2025-01-03T00:00:00.000Z');
  });

  it('keeps the inclusive boundaries (first day and last day) in range', () => {
    store.date = '2025-01-01';
    expect(iso(renderHook(() => useDateSliderDates()).result.current.date)).toBe(
      '2025-01-01T00:00:00.000Z',
    );

    store.date = '2025-01-05';
    expect(iso(renderHook(() => useDateSliderDates()).result.current.date)).toBe(
      '2025-01-05T00:00:00.000Z',
    );
  });

  it('clamps a date before the range to the last selectable day', () => {
    store.date = '2024-12-01';
    expect(iso(renderHook(() => useDateSliderDates()).result.current.date)).toBe(
      '2025-01-05T00:00:00.000Z',
    );
  });

  it('clamps a date at/after the exclusive end to the last selectable day', () => {
    store.date = '2025-02-01';
    expect(iso(renderHook(() => useDateSliderDates()).result.current.date)).toBe(
      '2025-01-05T00:00:00.000Z',
    );
  });
});
