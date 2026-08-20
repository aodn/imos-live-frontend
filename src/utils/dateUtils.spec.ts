import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLastDateRange, isBeforeDays, localToUTC, utcToLocalDateTime } from './dateUtils';

// Pin to a fixed local time so the "today is..." functions are deterministic. The Playwright
// config uses Australia/Sydney for its E2E run; we match the host timezone here implicitly
// and assert in ranges that don't depend on it.

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

describe('getLastDateRange', () => {
  beforeEach(() => {
    // Pin "now" to a known instant so the generated dates are deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-29T12:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns the start (N-1 days ago) and end (today) boundaries', () => {
    const range = getLastDateRange(3);
    expect(range).toEqual({ start: '2026-05-27', end: '2026-05-29' });
  });

  it('supports yy / mm / dd format tokens', () => {
    const range = getLastDateRange(2, 'dd/mm/yy');
    expect(range).toEqual({ start: '28/05/26', end: '29/05/26' });
  });
});
