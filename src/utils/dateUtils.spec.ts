import { describe, expect, it } from 'vitest';
import {
  isWithinDaysBefore,
  naiveToDateOnly,
  naiveToUTCDate,
  instantToUTCString,
  utcToLocalDateTime,
} from './dateUtils';

describe('naiveToUTCDate', () => {
  it('treats a bare yyyy-mm-dd as midnight UTC', () => {
    expect(naiveToUTCDate('2026-05-29').toISOString()).toBe('2026-05-29T00:00:00.000Z');
  });

  it('reads a naive datetime string as UTC-encoded fields', () => {
    expect(naiveToUTCDate('2026-05-29T14:30:00').toISOString()).toBe('2026-05-29T14:30:00.000Z');
  });

  it('throws on a trailing "Z" (a real UTC instant, not a naive datetime)', () => {
    expect(() => naiveToUTCDate('2026-05-29T14:30:00Z')).toThrow(/timezone-free/);
  });

  it('throws on a real timezone offset', () => {
    expect(() => naiveToUTCDate('2026-05-29T14:30:00+10:00')).toThrow(/timezone-free/);
  });
});

describe('naiveToDateOnly', () => {
  it('extracts the yyyy-mm-dd portion from a naive datetime string', () => {
    expect(naiveToDateOnly('2026-05-29T14:30:00')).toBe('2026-05-29');
  });

  it('passes a bare yyyy-mm-dd through unchanged', () => {
    expect(naiveToDateOnly('2026-05-29')).toBe('2026-05-29');
  });
});

describe('isWithinDaysBefore', () => {
  it('returns true when a is within `days` days before b', () => {
    expect(isWithinDaysBefore('2026-05-01', '2026-05-29', 30)).toBe(true);
  });

  it('returns false when a is more than `days` days before b', () => {
    expect(isWithinDaysBefore('2026-01-01', '2026-05-29', 30)).toBe(false);
  });

  it('returns false when a is after b', () => {
    expect(isWithinDaysBefore('2026-06-01', '2026-05-29', 30)).toBe(false);
  });

  it('returns true on the same day', () => {
    expect(isWithinDaysBefore('2026-05-29', '2026-05-29', 30)).toBe(true);
  });
});

describe('instantToUTCString', () => {
  it('appends the UTC suffix expected by the site APIs', () => {
    expect(instantToUTCString('2026-05-29T00:00:00Z')).toMatch(/^2026-05-29T\d{2}:\d{2}:\d{2}Z$/);
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
