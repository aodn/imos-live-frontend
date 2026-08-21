import { describe, expect, it } from 'vitest';
import {
  isBeforeDays,
  toDateOnly,
  toUTCDate,
  toUTCNanoString,
  utcToLocalDateTime,
} from './dateUtils';

// Pin to a fixed local time so the "today is..." functions are deterministic. The Playwright
// config uses Australia/Sydney for its E2E run; we match the host timezone here implicitly
// and assert in ranges that don't depend on it.

describe('toUTCDate', () => {
  it('treats a bare yyyy-mm-dd as midnight UTC', () => {
    expect(toUTCDate('2026-05-29').toISOString()).toBe('2026-05-29T00:00:00.000Z');
  });

  it('reads a naive datetime string as UTC-encoded fields', () => {
    expect(toUTCDate('2026-05-29T14:30:00').toISOString()).toBe('2026-05-29T14:30:00.000Z');
  });

  it('throws on a trailing "Z" (a real UTC instant, not a naive datetime)', () => {
    expect(() => toUTCDate('2026-05-29T14:30:00Z')).toThrow(/timezone-free/);
  });

  it('throws on a real timezone offset', () => {
    expect(() => toUTCDate('2026-05-29T14:30:00+10:00')).toThrow(/timezone-free/);
  });
});

describe('toDateOnly', () => {
  it('extracts the yyyy-mm-dd portion from a naive datetime string', () => {
    expect(toDateOnly('2026-05-29T14:30:00')).toBe('2026-05-29');
  });

  it('passes a bare yyyy-mm-dd through unchanged', () => {
    expect(toDateOnly('2026-05-29')).toBe('2026-05-29');
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

describe('toUTCNanoString', () => {
  it('appends the nanosecond UTC suffix expected by the site APIs', () => {
    // Format = 'YYYY-MM-DDTHH:mm:ss.000000000Z' — the literal nanosecond zeros are required.
    expect(toUTCNanoString('2026-05-29T00:00:00Z')).toMatch(
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
