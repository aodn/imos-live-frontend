import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getLastDates,
  getLatestFulfilledDate,
  isBeforeDays,
  isSameDay,
  localToUTC,
  toCompactDate,
  toISOFromCompact,
  utcToLocalDateTime,
} from './dateUtils';

// Pin to a fixed local time so the "today is..." functions are deterministic. The Playwright
// config uses Australia/Sydney for its E2E run; we match the host timezone here implicitly
// and assert in ranges that don't depend on it.

describe('toISOFromCompact / toCompactDate', () => {
  it('toISOFromCompact inserts dashes', () => {
    expect(toISOFromCompact('20260529')).toBe('2026-05-29');
  });

  it('toCompactDate strips dashes', () => {
    expect(toCompactDate('2026-05-29')).toBe('20260529');
  });

  it('toCompactDate returns undefined for malformed input', () => {
    expect(toCompactDate('2026/05/29')).toBeUndefined();
    expect(toCompactDate('not a date')).toBeUndefined();
  });
});

describe('isSameDay', () => {
  it('returns true for same year/month/day at different times', () => {
    expect(isSameDay(new Date('2026-05-29T01:00:00'), new Date('2026-05-29T23:00:00'))).toBe(true);
  });

  it('returns false for adjacent days', () => {
    expect(isSameDay(new Date('2026-05-29'), new Date('2026-05-30'))).toBe(false);
  });
});

describe('getLatestFulfilledDate', () => {
  it('returns the lexicographically largest fulfilled value', () => {
    const results: PromiseSettledResult<string | null>[] = [
      { status: 'fulfilled', value: '2026-05-01' },
      { status: 'fulfilled', value: '2026-05-29' },
      { status: 'fulfilled', value: '2026-05-15' },
    ];
    expect(getLatestFulfilledDate(results)).toBe('2026-05-29');
  });

  it('ignores rejected and null-valued promises', () => {
    const results: PromiseSettledResult<string | null>[] = [
      { status: 'rejected', reason: new Error('x') },
      { status: 'fulfilled', value: null },
      { status: 'fulfilled', value: '2026-05-01' },
    ];
    expect(getLatestFulfilledDate(results)).toBe('2026-05-01');
  });

  it('returns undefined when no fulfilled string values exist', () => {
    const results: PromiseSettledResult<string | null>[] = [
      { status: 'fulfilled', value: null },
      { status: 'rejected', reason: new Error('x') },
    ];
    expect(getLatestFulfilledDate(results)).toBeUndefined();
  });
});

describe('isBeforeDays', () => {
  it('returns true when a is within `days` days before b', () => {
    expect(isBeforeDays('2026-05-01', '2026-05-29', 30)).toBe(true);
  });

  it('returns false when a is more than `days` days before b', () => {
    expect(isBeforeDays('2026-01-01', '2026-05-29', 30)).toBe(false);
  });

  it('returns false when a is after b', () => {
    expect(isBeforeDays('2026-06-01', '2026-05-29', 30)).toBe(false);
  });

  it('returns true on the same day', () => {
    expect(isBeforeDays('2026-05-29', '2026-05-29', 30)).toBe(true);
  });
});

describe('localToUTC', () => {
  it('appends the nanosecond UTC suffix expected by the wave buoy API', () => {
    // Format = 'YYYY-MM-DDTHH:mm:ss.000000000Z' — the literal nanosecond zeros are required.
    expect(localToUTC('2026-05-29T00:00:00Z')).toMatch(
      /^2026-05-29T\d{2}:\d{2}:\d{2}\.000000000Z$/,
    );
  });
});

describe('utcToLocalDateTime', () => {
  it('parses a UTC ISO string and formats in local time', () => {
    const result = utcToLocalDateTime('2026-05-29T00:00:00Z', 'YYYY-MM-DD');
    // We can't pin the host's TZ in the test runner, so just assert shape + plausible value.
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws on an invalid input', () => {
    expect(() => utcToLocalDateTime('not a date')).toThrow('Invalid UTC date');
  });
});

describe('getLastDates', () => {
  beforeEach(() => {
    // Pin "now" to a known instant so the generated dates are deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns exactly N dates ending today', () => {
    const dates = getLastDates(3)('yyyy-mm-dd');
    expect(dates).toHaveLength(3);
    expect(dates[2]).toBe('2026-05-29');
  });

  it('supports yy / mm / dd format tokens', () => {
    const dates = getLastDates(2)('dd/mm/yy');
    expect(dates[1]).toBe('29/05/26');
  });
});
