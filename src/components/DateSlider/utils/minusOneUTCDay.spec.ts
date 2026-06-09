import { describe, expect, it } from 'vitest';
import { minusOneUTCDay } from './minusOneUTCDay';

describe('minusOneUTCDay', () => {
  it('subtracts exactly 24 hours in UTC', () => {
    const result = minusOneUTCDay(new Date('2026-05-29T00:00:00Z'));
    expect(result.toISOString()).toBe('2026-05-28T00:00:00.000Z');
  });

  it('crosses the month boundary correctly', () => {
    expect(minusOneUTCDay(new Date('2026-06-01T00:00:00Z')).toISOString()).toBe(
      '2026-05-31T00:00:00.000Z',
    );
  });

  it('does not mutate the input', () => {
    const original = new Date('2026-05-29T00:00:00Z');
    const snapshot = original.getTime();
    minusOneUTCDay(original);
    expect(original.getTime()).toBe(snapshot);
  });

  it('preserves the UTC time-of-day', () => {
    const result = minusOneUTCDay(new Date('2026-05-29T14:23:45.123Z'));
    expect(result.toISOString()).toBe('2026-05-28T14:23:45.123Z');
  });
});
