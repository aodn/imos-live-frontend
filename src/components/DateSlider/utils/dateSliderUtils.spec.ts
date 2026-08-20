import { describe, expect, it } from 'vitest';
import type { RefObject } from 'react';
import {
  addTime,
  calculateLabelPosition,
  createSelectionResult,
  defaultScaleTypeResolver,
  formatDate,
  generateNewDateByAddingScaleUnit,
  generateScales,
  generateTrackWidth,
  getAllScalesPercentage,
  getDateFromPercent,
  getPercentFromDate,
  getPercentageFromMouseEvent,
  getPercentageFromTouchEvent,
  getRepresentativeDate,
  getScaleDateAt,
  getTotalScales,
  getTrackVisibleRange,
  handleOutsideVisibleArea,
  labelDateFormatFn,
  scaleDateFormatFn,
  toNaiveDateTimeString,
  toUTCDate,
} from './dateSliderUtils';

const makeTrackRef = (rect: Partial<DOMRect>) =>
  ({
    current: {
      getBoundingClientRect: () => ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 0,
        width: 100,
        ...rect,
      }),
    },
  }) as unknown as RefObject<HTMLDivElement | null>;

describe('generateNewDateByAddingScaleUnit', () => {
  it('adds hours in UTC', () => {
    const result = generateNewDateByAddingScaleUnit(new Date('2026-05-29T10:00:00Z'), 5, 'hour');
    expect(result.toISOString()).toBe('2026-05-29T15:00:00.000Z');
  });

  it('adds days in UTC across month boundaries', () => {
    const result = generateNewDateByAddingScaleUnit(new Date('2026-01-30T00:00:00Z'), 3, 'day');
    expect(result.toISOString()).toBe('2026-02-02T00:00:00.000Z');
  });

  it('adds months in UTC across year boundaries', () => {
    const result = generateNewDateByAddingScaleUnit(new Date('2026-11-15T00:00:00Z'), 3, 'month');
    expect(result.toISOString()).toBe('2027-02-15T00:00:00.000Z');
  });

  it('adds years in UTC', () => {
    const result = generateNewDateByAddingScaleUnit(new Date('2026-05-29T00:00:00Z'), 2, 'year');
    expect(result.toISOString()).toBe('2028-05-29T00:00:00.000Z');
  });

  it('accepts negative amounts', () => {
    const result = generateNewDateByAddingScaleUnit(new Date('2026-05-29T00:00:00Z'), -1, 'day');
    expect(result.toISOString()).toBe('2026-05-28T00:00:00.000Z');
  });

  it('does not mutate input', () => {
    const original = new Date('2026-05-29T00:00:00Z');
    generateNewDateByAddingScaleUnit(original, 5, 'day');
    expect(original.toISOString()).toBe('2026-05-29T00:00:00.000Z');
  });
});

describe('getScaleDateAt', () => {
  it('adds days for day unit, preserving day-of-month', () => {
    const start = new Date('2026-06-20T00:00:00Z');
    expect(getScaleDateAt(start, 0, 'day').toISOString()).toBe('2026-06-20T00:00:00.000Z');
    expect(getScaleDateAt(start, 3, 'day').toISOString()).toBe('2026-06-23T00:00:00.000Z');
  });

  it('aligns month ticks to the 1st of each month, not the start day-of-month', () => {
    // Range starting on the 20th must still produce first-of-month ticks.
    const start = new Date('2026-06-20T00:00:00Z');
    expect(getScaleDateAt(start, 0, 'month').toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(getScaleDateAt(start, 1, 'month').toISOString()).toBe('2026-08-01T00:00:00.000Z');
    expect(getScaleDateAt(start, 6, 'month').toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('keeps the start month when the range already begins on the 1st', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    expect(getScaleDateAt(start, 0, 'month').toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(getScaleDateAt(start, 2, 'month').toISOString()).toBe('2026-03-01T00:00:00.000Z');
  });

  it('aligns year ticks to Jan 1', () => {
    const start = new Date('2026-06-20T00:00:00Z');
    expect(getScaleDateAt(start, 0, 'year').toISOString()).toBe('2027-01-01T00:00:00.000Z');
    const startOfYear = new Date('2026-01-01T00:00:00Z');
    expect(getScaleDateAt(startOfYear, 0, 'year').toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });
});

describe('getTotalScales', () => {
  it('counts hours between two dates', () => {
    expect(
      getTotalScales(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-02T01:00:00Z'), 'hour'),
    ).toBe(25);
  });

  it('rounds up partial days', () => {
    expect(
      getTotalScales(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-03T00:00:00Z'), 'day'),
    ).toBe(2);
    expect(
      getTotalScales(new Date('2026-01-01T00:00:00Z'), new Date('2026-01-03T01:00:00Z'), 'day'),
    ).toBe(3);
  });

  it('counts months inclusively across years', () => {
    expect(getTotalScales(new Date('2026-01-01Z'), new Date('2026-03-31Z'), 'month')).toBe(3);
    expect(getTotalScales(new Date('2025-11-01Z'), new Date('2026-02-28Z'), 'month')).toBe(4);
  });

  it('counts years inclusively', () => {
    expect(getTotalScales(new Date('2024-01-01Z'), new Date('2026-12-31Z'), 'year')).toBe(3);
  });
});

describe('getRepresentativeDate', () => {
  it('returns hour granularity for hour unit', () => {
    const result = getRepresentativeDate(new Date('2026-05-29T14:23:45Z'), 'hour');
    expect(result.toISOString()).toBe('2026-05-29T14:00:00.000Z');
  });

  it('returns midnight for day unit', () => {
    const result = getRepresentativeDate(new Date('2026-05-29T14:23:45Z'), 'day');
    expect(result.toISOString()).toBe('2026-05-29T00:00:00.000Z');
  });

  it('returns January 1st of the year for month unit', () => {
    const result = getRepresentativeDate(new Date('2026-05-29T14:23:45Z'), 'month');
    expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns January 1st of the decade for year unit', () => {
    expect(getRepresentativeDate(new Date('2026-05-29T14:23:45Z'), 'year').toISOString()).toBe(
      '2020-01-01T00:00:00.000Z',
    );
    expect(getRepresentativeDate(new Date('2031-05-29T14:23:45Z'), 'year').toISOString()).toBe(
      '2030-01-01T00:00:00.000Z',
    );
  });
});

describe('generateTrackWidth', () => {
  const scaleUnitConfig = {
    gap: 10,
    width: { short: 1, medium: 2, long: 4 },
    height: { short: 8, medium: 16, long: 32 },
  };

  it('adds gaps + all scale-mark widths', () => {
    // total * gap + long*4 + medium*2 + short*1
    expect(generateTrackWidth(5, { short: 2, medium: 1, long: 1 }, scaleUnitConfig)).toBe(
      5 * 10 + 1 * 4 + 1 * 2 + 2 * 1,
    );
  });

  it('returns 0 when nothing to render', () => {
    expect(generateTrackWidth(0, { short: 0, medium: 0, long: 0 }, scaleUnitConfig)).toBe(0);
  });
});

describe('generateScales', () => {
  it('emits a scale at each unit and appends an end-of-range entry when needed', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-05T00:00:00Z');
    const total = getTotalScales(start, end, 'day');
    const { scales, numberOfScales } = generateScales(start, end, 'day', total);

    expect(scales[0].date.toISOString()).toBe(start.toISOString());
    expect(scales[scales.length - 1].date.toISOString()).toBe(end.toISOString());
    // positions are percentages
    expect(scales[0].position).toBe(0);
    expect(scales[scales.length - 1].position).toBe(100);

    const total2 = numberOfScales.short + numberOfScales.medium + numberOfScales.long;
    expect(total2).toBe(scales.length);
  });

  it('respects a custom scaleTypeResolver', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-04T00:00:00Z');
    const total = getTotalScales(start, end, 'day');
    const { scales } = generateScales(start, end, 'day', total, () => 'long');
    // Final synthetic end-of-range entry is hardcoded to 'short' — only check inner scales.
    expect(scales.slice(0, -1).every(s => s.type === 'long')).toBe(true);
  });

  it('falls back to defaultScaleTypeResolver when resolver returns undefined', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-03T00:00:00Z');
    const total = getTotalScales(start, end, 'day');
    const { scales } = generateScales(start, end, 'day', total, () => undefined as any);
    // Jan 1 → long (first of month) per defaultScaleTypeResolver
    expect(scales[0].type).toBe('long');
  });

  it('emits month ticks on the 1st of each month for a range starting mid-month', () => {
    const start = new Date('2026-06-20T00:00:00Z');
    const end = new Date('2026-10-10T00:00:00Z');
    const total = getTotalScales(start, end, 'month');
    const { scales } = generateScales(start, end, 'month', total);
    // Every generated tick must land on the 1st of a month.
    expect(scales.every(s => s.date.getUTCDate() === 1)).toBe(true);
    expect(scales[0].date.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('skips dates that exceed the end date', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-02T00:00:00Z');
    const { scales } = generateScales(start, end, 'day', 100);
    // Even though totalUnits=100, the loop bails when current > end
    expect(scales.length).toBeLessThanOrEqual(3);
  });
});

describe('getDateFromPercent', () => {
  it('maps 0% to start and 100% to end', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-31T00:00:00Z');
    expect(getDateFromPercent(0, start, end).toISOString()).toBe(start.toISOString());
    expect(getDateFromPercent(100, start, end).toISOString()).toBe(end.toISOString());
  });

  it('linearly interpolates between start and end', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-03T00:00:00Z'); // 48h span
    const mid = getDateFromPercent(50, start, end);
    expect(mid.toISOString()).toBe('2026-01-02T00:00:00.000Z');
  });
});

describe('createSelectionResult', () => {
  const start = new Date('2026-01-01T00:00:00Z');
  const end = new Date('2026-01-11T00:00:00Z');

  it('returns { start, end } in range mode', () => {
    const result = createSelectionResult(10, start, end, 90, 50, 'range');
    expect(result).toMatchObject({
      start: expect.any(Date),
      end: expect.any(Date),
    });
    expect((result as any).point).toBeUndefined();
  });

  it('returns { point } in point mode', () => {
    const result = createSelectionResult(0, start, end, 100, 50, 'point');
    expect(result).toMatchObject({ point: expect.any(Date) });
    expect((result as any).start).toBeUndefined();
  });

  it('returns { start, end, point } in combined mode', () => {
    const result = createSelectionResult(10, start, end, 90, 50, 'combined');
    expect(result).toMatchObject({
      start: expect.any(Date),
      end: expect.any(Date),
      point: expect.any(Date),
    });
  });
});

describe('getAllScalesPercentage', () => {
  it('returns positions in ascending order from 0 to ≤100', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-05T00:00:00Z');
    const totalUnits = getTotalScales(start, end, 'day');
    const positions = getAllScalesPercentage(start, end, 'day', totalUnits);
    expect(positions[0]).toBe(0);
    expect(positions[positions.length - 1]).toBeLessThanOrEqual(100);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('stops generating when adding a unit would exceed the end date', () => {
    const start = new Date('2026-01-01T00:00:00Z');
    const end = new Date('2026-01-02T00:00:00Z');
    expect(getAllScalesPercentage(start, end, 'day', 100).length).toBeLessThanOrEqual(2);
  });
});

describe('toUTCDate', () => {
  it('converts a YYYY-MM-DD string to UTC midnight', () => {
    expect(toUTCDate('2026-05-29').toISOString()).toBe('2026-05-29T00:00:00.000Z');
  });

  it('reads a naive datetime string as UTC-encoded fields, regardless of host timezone', () => {
    // Guards against the JS Date footgun: `new Date('2026-05-29T14:30:00')` (no offset) parses
    // as *local* time, not UTC — environment-dependent. toUTCDate must not do that.
    expect(toUTCDate('2026-05-29T14:30:00').toISOString()).toBe('2026-05-29T14:30:00.000Z');
  });

  it('defaults seconds to :00 when omitted', () => {
    expect(toUTCDate('2026-05-29T14:30').toISOString()).toBe('2026-05-29T14:30:00.000Z');
  });

  it('throws on a trailing "Z" (a real UTC instant, not a naive datetime)', () => {
    expect(() => toUTCDate('2026-05-29T14:30:00Z')).toThrow(/timezone-free/);
  });

  it('throws on a real timezone offset', () => {
    expect(() => toUTCDate('2026-05-29T14:30:00+10:00')).toThrow(/timezone-free/);
  });

  it('throws on invalid input', () => {
    expect(() => toUTCDate('not-a-date')).toThrow(/not a valid naive datetime/);
  });
});

describe('toNaiveDateTimeString', () => {
  it('formats a UTC-encoded Date back into the naive wire format', () => {
    expect(toNaiveDateTimeString(new Date('2026-05-29T14:30:00.000Z'))).toBe('2026-05-29T14:30:00');
  });

  it('round-trips through toUTCDate', () => {
    const naive = '2026-05-29T09:05:03';
    expect(toNaiveDateTimeString(toUTCDate(naive))).toBe(naive);
  });
});

describe('addTime', () => {
  const base = new Date('2026-01-15T12:00:00Z');

  it('adds minutes', () => {
    expect(addTime(base, 30, 'minute').toISOString()).toBe('2026-01-15T12:30:00.000Z');
  });

  it('adds hours', () => {
    expect(addTime(base, 3, 'hour').toISOString()).toBe('2026-01-15T15:00:00.000Z');
  });

  it('adds days', () => {
    expect(addTime(base, 1, 'day').toISOString()).toBe('2026-01-16T12:00:00.000Z');
  });

  it('adds months', () => {
    expect(addTime(base, 1, 'month').toISOString()).toBe('2026-02-15T12:00:00.000Z');
  });

  it('adds years', () => {
    expect(addTime(base, 1, 'year').toISOString()).toBe('2027-01-15T12:00:00.000Z');
  });

  it('accepts negative amounts', () => {
    expect(addTime(base, -2, 'hour').toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('does not mutate input', () => {
    addTime(base, 5, 'day');
    expect(base.toISOString()).toBe('2026-01-15T12:00:00.000Z');
  });
});

describe('getPercentFromDate', () => {
  const start = new Date('2026-01-01T00:00:00Z');
  const end = new Date('2026-01-31T00:00:00Z');

  it('returns 0 at start and 100 at end', () => {
    expect(getPercentFromDate(start, start, end)).toBe(0);
    expect(getPercentFromDate(end, start, end)).toBe(100);
  });

  it('returns ~50 at the midpoint', () => {
    const mid = new Date('2026-01-16T00:00:00Z');
    expect(getPercentFromDate(mid, start, end)).toBeCloseTo(50, 0);
  });

  it('clamps dates outside the range', () => {
    expect(getPercentFromDate(new Date('2025-12-01Z'), start, end)).toBe(0);
    expect(getPercentFromDate(new Date('2027-12-01Z'), start, end)).toBe(100);
  });

  it('returns 0 when start === end', () => {
    expect(getPercentFromDate(start, start, start)).toBe(0);
  });
});

describe('defaultScaleTypeResolver', () => {
  it('classifies year boundaries as long for hour unit', () => {
    expect(defaultScaleTypeResolver(new Date('2026-01-01T00:00:00Z'), 'hour')).toBe('long');
  });

  it('classifies month boundaries as medium for hour unit', () => {
    expect(defaultScaleTypeResolver(new Date('2026-05-01T00:00:00Z'), 'hour')).toBe('medium');
  });

  it('classifies arbitrary hour as short', () => {
    expect(defaultScaleTypeResolver(new Date('2026-05-15T13:00:00Z'), 'hour')).toBe('short');
  });

  it('classifies first-of-month as long for day unit', () => {
    expect(defaultScaleTypeResolver(new Date('2026-05-01T00:00:00Z'), 'day')).toBe('long');
  });

  it('classifies Monday as medium for day unit', () => {
    // 2026-05-04 is a Monday
    expect(defaultScaleTypeResolver(new Date('2026-05-04T00:00:00Z'), 'day')).toBe('medium');
  });

  it('classifies January as long for month unit', () => {
    expect(defaultScaleTypeResolver(new Date('2026-01-15T00:00:00Z'), 'month')).toBe('long');
  });

  it('classifies quarter starts as medium for month unit', () => {
    expect(defaultScaleTypeResolver(new Date('2026-04-15T00:00:00Z'), 'month')).toBe('medium');
    expect(defaultScaleTypeResolver(new Date('2026-07-15T00:00:00Z'), 'month')).toBe('medium');
    expect(defaultScaleTypeResolver(new Date('2026-10-15T00:00:00Z'), 'month')).toBe('medium');
  });

  it('classifies decade starts as long for year unit', () => {
    expect(defaultScaleTypeResolver(new Date('2020-06-01Z'), 'year')).toBe('long');
  });

  it('classifies 5-year marks as medium for year unit', () => {
    expect(defaultScaleTypeResolver(new Date('2025-06-01Z'), 'year')).toBe('medium');
  });

  it('classifies plain years as short', () => {
    expect(defaultScaleTypeResolver(new Date('2026-06-01Z'), 'year')).toBe('short');
  });
});

describe('scaleDateFormatFn', () => {
  it('returns YYYY on Jan 1', () => {
    expect(scaleDateFormatFn({ date: new Date('2026-01-01T00:00:00Z') })).toBe('YYYY');
  });

  it('returns MMM on first of any other month', () => {
    expect(scaleDateFormatFn({ date: new Date('2026-05-01T00:00:00Z') })).toBe('MMM');
  });

  it('returns DD otherwise', () => {
    expect(scaleDateFormatFn({ date: new Date('2026-05-15T00:00:00Z') })).toBe('DD');
  });
});

describe('labelDateFormatFn', () => {
  it('returns DD-MMM-YYYY', () => {
    expect(labelDateFormatFn({ date: new Date('2026-05-29T00:00:00Z') })).toBe('DD-MMM-YYYY');
  });
});

describe('formatDate', () => {
  const format = { scale: scaleDateFormatFn, label: labelDateFormatFn };

  it('formats according to scale variant', () => {
    expect(
      formatDate({
        date: new Date('2026-05-15T00:00:00Z'),
        format,
        locale: 'en',
        variant: 'scale',
        timeUnit: 'day',
      }),
    ).toBe('15');
  });

  it('formats according to label variant', () => {
    expect(
      formatDate({
        date: new Date('2026-05-29T00:00:00Z'),
        format,
        locale: 'en',
        variant: 'label',
        timeUnit: 'day',
      }),
    ).toBe('29-May-2026');
  });

  it('returns empty string when pattern is empty', () => {
    expect(
      formatDate({
        date: new Date('2026-05-29T00:00:00Z'),
        format: { scale: () => '', label: () => '' },
        locale: 'en',
        variant: 'scale',
        timeUnit: 'day',
      }),
    ).toBe('');
  });
});

describe('getTrackVisibleRange', () => {
  it('expands the visible window by a 50% buffer on each side, clamped to [0, 100]', () => {
    const result = getTrackVisibleRange({
      sliderPositionX: -500,
      sliderContainerWidth: 1000,
      trackWidth: 4000,
    });
    // scrollLeft=500/4000=12.5% → +50%vw buffer (1000*0.5=500 → 12.5%) → start=0
    // end = (500+1000)/4000 = 37.5% + 12.5% = 50%
    expect(result.start).toBeCloseTo(0, 5);
    expect(result.end).toBeCloseTo(50, 5);
  });

  it('clamps end to 100 when at right edge', () => {
    const result = getTrackVisibleRange({
      sliderPositionX: -3000,
      sliderContainerWidth: 1000,
      trackWidth: 4000,
    });
    expect(result.end).toBe(100);
  });
});

describe('handleOutsideVisibleArea', () => {
  const makeButtonRef = (rect: Partial<DOMRect>): RefObject<HTMLButtonElement | null> =>
    ({
      current: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          ...rect,
        }),
      },
    }) as unknown as RefObject<HTMLButtonElement | null>;

  const containerRef = makeButtonRef({
    left: 0,
    right: 1000,
  }) as unknown as RefObject<HTMLDivElement | null>;

  it('reports leftOut when handle left is past container left', () => {
    const result = handleOutsideVisibleArea({
      sliderContainerRef: containerRef,
      handleRef: makeButtonRef({ left: -10, right: 30 }),
    });
    expect(result).toEqual({ leftOut: true, rightOut: false });
  });

  it('reports rightOut when handle right is past container right', () => {
    const result = handleOutsideVisibleArea({
      sliderContainerRef: containerRef,
      handleRef: makeButtonRef({ left: 950, right: 1050 }),
    });
    expect(result).toEqual({ leftOut: false, rightOut: true });
  });

  it('reports neither when handle is fully inside', () => {
    const result = handleOutsideVisibleArea({
      sliderContainerRef: containerRef,
      handleRef: makeButtonRef({ left: 100, right: 200 }),
    });
    expect(result).toEqual({ leftOut: false, rightOut: false });
  });
});

describe('getPercentageFromMouseEvent', () => {
  it('returns 0 when ref is null', () => {
    const ref = { current: null } as RefObject<HTMLDivElement | null>;
    expect(getPercentageFromMouseEvent({ clientX: 50 } as MouseEvent, ref)).toBe(0);
  });

  it('converts clientX to percentage relative to track', () => {
    const ref = makeTrackRef({ left: 100, width: 400 });
    expect(getPercentageFromMouseEvent({ clientX: 200 } as MouseEvent, ref)).toBe(25);
  });

  it('clamps to [0, 100]', () => {
    const ref = makeTrackRef({ left: 100, width: 400 });
    expect(getPercentageFromMouseEvent({ clientX: 50 } as MouseEvent, ref)).toBe(0);
    expect(getPercentageFromMouseEvent({ clientX: 1000 } as MouseEvent, ref)).toBe(100);
  });
});

describe('getPercentageFromTouchEvent', () => {
  it('returns 0 when ref is null', () => {
    const ref = { current: null } as RefObject<HTMLDivElement | null>;
    const evt = { touches: [{ clientX: 50 }], changedTouches: [] } as unknown as TouchEvent;
    expect(getPercentageFromTouchEvent(evt, ref)).toBe(0);
  });

  it('returns 0 when there are no touches', () => {
    const ref = makeTrackRef({});
    const evt = { touches: [], changedTouches: [] } as unknown as TouchEvent;
    expect(getPercentageFromTouchEvent(evt, ref)).toBe(0);
  });

  it('uses touches[0].clientX for the percentage', () => {
    const ref = makeTrackRef({ left: 0, width: 200 });
    const evt = {
      touches: [{ clientX: 100 }],
      changedTouches: [{ clientX: 999 }],
    } as unknown as TouchEvent;
    expect(getPercentageFromTouchEvent(evt, ref)).toBe(50);
  });
});

describe('calculateLabelPosition', () => {
  const makeButtonRef = (rect: Partial<DOMRect>): RefObject<HTMLButtonElement | null> =>
    ({
      current: {
        getBoundingClientRect: () => ({
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          ...rect,
        }),
      },
    }) as unknown as RefObject<HTMLButtonElement | null>;

  it('returns x = cursorPosition and y = handleTop - distance', () => {
    const ref = makeButtonRef({ top: 200 });
    expect(calculateLabelPosition(ref, 50, 24)).toEqual({ x: 50, y: 176 });
  });

  it('returns undefined when ref is null', () => {
    const ref = { current: null } as RefObject<HTMLButtonElement | null>;
    expect(calculateLabelPosition(ref, 50, 24)).toBeUndefined();
  });
});
