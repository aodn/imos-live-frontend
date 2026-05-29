// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOnChangeNotifier } from './useOnChangeNotifier';
import { TIMING } from '../constants';

const startDate = new Date('2026-01-01T00:00:00Z');
const endDate = new Date('2026-01-31T00:00:00Z');

describe('useOnChangeNotifier', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('emits a debounced point-mode selection', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useOnChangeNotifier({
        onChange,
        rangeStartPosition: 0,
        rangeEndPosition: 100,
        pointPosition: 50,
        startDate,
        endDate,
        viewMode: 'point',
      }),
    );
    expect(onChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(TIMING.DEBOUNCE_DELAY);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0]).toMatchObject({ point: expect.any(Date) });
  });

  it('emits a debounced range-mode selection', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useOnChangeNotifier({
        onChange,
        rangeStartPosition: 10,
        rangeEndPosition: 90,
        pointPosition: 50,
        startDate,
        endDate,
        viewMode: 'range',
      }),
    );
    act(() => {
      vi.advanceTimersByTime(TIMING.DEBOUNCE_DELAY);
    });
    expect(onChange.mock.calls[0][0]).toMatchObject({
      start: expect.any(Date),
      end: expect.any(Date),
    });
  });

  it('emits a debounced combined-mode selection (start, end, point)', () => {
    const onChange = vi.fn();
    renderHook(() =>
      useOnChangeNotifier({
        onChange,
        rangeStartPosition: 10,
        rangeEndPosition: 90,
        pointPosition: 50,
        startDate,
        endDate,
        viewMode: 'combined',
      }),
    );
    act(() => {
      vi.advanceTimersByTime(TIMING.DEBOUNCE_DELAY);
    });
    expect(onChange.mock.calls[0][0]).toMatchObject({
      start: expect.any(Date),
      end: expect.any(Date),
      point: expect.any(Date),
    });
  });

  it('coalesces rapid position changes into a single trailing call', () => {
    const onChange = vi.fn();
    const { rerender } = renderHook(props => useOnChangeNotifier(props), {
      initialProps: {
        onChange,
        rangeStartPosition: 0,
        rangeEndPosition: 100,
        pointPosition: 10,
        startDate,
        endDate,
        viewMode: 'point' as const,
      },
    });
    rerender({
      onChange,
      rangeStartPosition: 0,
      rangeEndPosition: 100,
      pointPosition: 30,
      startDate,
      endDate,
      viewMode: 'point',
    });
    rerender({
      onChange,
      rangeStartPosition: 0,
      rangeEndPosition: 100,
      pointPosition: 70,
      startDate,
      endDate,
      viewMode: 'point',
    });
    act(() => {
      vi.advanceTimersByTime(TIMING.DEBOUNCE_DELAY);
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('uses the latest onChange identity without re-creating the debouncer', () => {
    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const { rerender } = renderHook(
      ({ cb }) =>
        useOnChangeNotifier({
          onChange: cb,
          rangeStartPosition: 0,
          rangeEndPosition: 100,
          pointPosition: 50,
          startDate,
          endDate,
          viewMode: 'point',
        }),
      { initialProps: { cb: onChangeA as any } },
    );
    rerender({ cb: onChangeB });
    act(() => {
      vi.advanceTimersByTime(TIMING.DEBOUNCE_DELAY);
    });
    // Latest cb wins
    expect(onChangeB).toHaveBeenCalled();
  });
});
