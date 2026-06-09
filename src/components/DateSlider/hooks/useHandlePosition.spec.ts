// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHandlePosition } from './useHandlePosition';
import type { ViewMode } from '../type';

type Setup = {
  viewMode?: ViewMode;
  minGapPercent?: number;
  initial?: { start?: number; end?: number; point?: number };
  step?: any;
  timeUnit?: 'day' | 'hour' | 'month' | 'year';
};

function setup({
  viewMode = 'point',
  minGapPercent = 0,
  initial = { start: 0, end: 100, point: 50 },
  step,
  timeUnit = 'day',
}: Setup = {}) {
  const startDate = new Date('2026-01-01T00:00:00Z');
  // 11 days span — endDate is exclusive (-1 day applied inside useHandlePosition).
  const endDate = new Date('2026-01-12T00:00:00Z');

  const setRangeStartPosition = vi.fn();
  const setRangeEndPosition = vi.fn();
  const setPointPosition = vi.fn();

  const rangeStartRef = { current: initial.start ?? 0 };
  const rangeEndRef = { current: initial.end ?? 100 };
  const pointPositionRef = { current: initial.point ?? 50 };
  const autoScrollToVisibleAreaRef = { current: false };

  const { result } = renderHook(() =>
    useHandlePosition({
      minGapPercent,
      startDate,
      endDate,
      viewMode,
      setRangeStartPosition,
      setRangeEndPosition,
      setPointPosition,
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
      autoScrollToVisibleAreaRef,
      step,
      timeUnit,
    }),
  );

  return {
    result,
    setRangeStartPosition,
    setRangeEndPosition,
    setPointPosition,
    rangeStartRef,
    rangeEndRef,
    pointPositionRef,
    autoScrollToVisibleAreaRef,
    startDate,
    endDate,
  };
}

describe('useHandlePosition.updateHandlePosition', () => {
  it('clamps the new start to [0, end-minGap]', () => {
    const ctx = setup({
      viewMode: 'range',
      initial: { start: 0, end: 50, point: 50 },
      minGapPercent: 10,
    });
    act(() => ctx.result.current.updateHandlePosition('start', 80));
    // Should clamp to end(50) - minGap(10) = 40
    expect(ctx.setRangeStartPosition).toHaveBeenCalledWith(40);
  });

  it('clamps negatives to 0 for start', () => {
    const ctx = setup({ viewMode: 'range' });
    act(() => ctx.result.current.updateHandlePosition('start', -50));
    expect(ctx.setRangeStartPosition).toHaveBeenCalledWith(0);
  });

  it('keeps end within the inner-min envelope when end > start + minGap', () => {
    const ctx = setup({
      viewMode: 'range',
      initial: { start: 30, end: 100, point: 50 },
      minGapPercent: 10,
    });
    // 80 < 100(clampedPercentage). Math.max(80, 30+10=40)=80. Math.min(80,80)=80.
    act(() => ctx.result.current.updateHandlePosition('end', 80));
    expect(ctx.setRangeEndPosition).toHaveBeenCalledWith(80);
  });

  it('updates the point position via percent', () => {
    const ctx = setup({ viewMode: 'point' });
    act(() => ctx.result.current.updateHandlePosition('point', 25));
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
  });
});

describe('useHandlePosition.setDateTime', () => {
  it('converts a date to a percentage and updates the point handle in point mode', () => {
    const ctx = setup({ viewMode: 'point' });
    const midDate = new Date('2026-01-06T00:00:00Z'); // ~halfway between Jan 1 and Jan 12
    act(() => ctx.result.current.setDateTime(midDate));
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
    expect(ctx.autoScrollToVisibleAreaRef.current).toBe(true);
  });

  it('falls back to (endDate - 1 day) when date is out of range', () => {
    const ctx = setup({ viewMode: 'point' });
    // Way past end
    act(() => ctx.result.current.setDateTime(new Date('2030-01-01Z')));
    // Should still call setPointPosition (with the clamped date)
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
  });

  it('respects an explicit target', () => {
    const ctx = setup({ viewMode: 'range' });
    act(() => ctx.result.current.setDateTime(new Date('2026-01-05T00:00:00Z'), 'start'));
    expect(ctx.setRangeStartPosition).toHaveBeenCalledTimes(1);
    expect(ctx.setRangeEndPosition).not.toHaveBeenCalled();
  });

  it('range mode without target picks the closer handle (start)', () => {
    const ctx = setup({
      viewMode: 'range',
      initial: { start: 20, end: 80, point: 50 },
    });
    // ~Jan 3 is around 18%, much closer to start(20) than to end(80)
    act(() => ctx.result.current.setDateTime(new Date('2026-01-03T00:00:00Z')));
    expect(ctx.setRangeStartPosition).toHaveBeenCalled();
    expect(ctx.setRangeEndPosition).not.toHaveBeenCalled();
  });

  it('range mode without target picks the closer handle (end)', () => {
    const ctx = setup({
      viewMode: 'range',
      initial: { start: 20, end: 80, point: 50 },
    });
    act(() => ctx.result.current.setDateTime(new Date('2026-01-10T00:00:00Z')));
    expect(ctx.setRangeEndPosition).toHaveBeenCalled();
    expect(ctx.setRangeStartPosition).not.toHaveBeenCalled();
  });

  it('combined mode without target updates the point handle', () => {
    const ctx = setup({ viewMode: 'combined' });
    act(() => ctx.result.current.setDateTime(new Date('2026-01-06T00:00:00Z')));
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
  });
});

describe('useHandlePosition.moveByStep', () => {
  it('moves forward by the static step amount', () => {
    const ctx = setup({
      viewMode: 'point',
      initial: { start: 0, end: 100, point: 50 },
      step: { amount: 1, unit: 'day' },
    });
    act(() => ctx.result.current.moveByStep('forward'));
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
  });

  it('moves backward by the static step amount', () => {
    const ctx = setup({
      viewMode: 'point',
      initial: { start: 0, end: 100, point: 50 },
      step: { amount: 2, unit: 'day' },
    });
    act(() => ctx.result.current.moveByStep('backward'));
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
  });

  it('calls a StepFn with date/unit/handle context', () => {
    const stepFn = vi.fn((..._args: unknown[]) => ({ amount: 1, unit: 'day' as const }));
    const ctx = setup({
      viewMode: 'point',
      initial: { start: 0, end: 100, point: 50 },
      step: stepFn as any,
    });
    act(() => ctx.result.current.moveByStep('forward'));
    expect(stepFn).toHaveBeenCalledTimes(1);
    const firstCallArg = stepFn.mock.calls[0]?.[0] as { handle: string; unit: string; date: Date };
    expect(firstCallArg).toMatchObject({ handle: 'point', unit: 'day' });
    expect(firstCallArg.date).toBeInstanceOf(Date);
  });

  it('falls back to {1, timeUnit} when step is undefined', () => {
    const ctx = setup({ viewMode: 'point', timeUnit: 'hour' });
    act(() => ctx.result.current.moveByStep('forward'));
    expect(ctx.setPointPosition).toHaveBeenCalledTimes(1);
  });

  it('defaults target to start in range mode', () => {
    const ctx = setup({
      viewMode: 'range',
      initial: { start: 20, end: 80, point: 50 },
      step: { amount: 1, unit: 'day' },
    });
    act(() => ctx.result.current.moveByStep('forward'));
    expect(ctx.setRangeStartPosition).toHaveBeenCalled();
  });

  it('honors an explicit target', () => {
    const ctx = setup({
      viewMode: 'range',
      initial: { start: 20, end: 80, point: 50 },
      step: { amount: 1, unit: 'day' },
    });
    act(() => ctx.result.current.moveByStep('forward', 'end'));
    expect(ctx.setRangeEndPosition).toHaveBeenCalled();
  });
});
