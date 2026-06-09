import { describe, expect, it } from 'vitest';
import { generateValueByPercentage } from './generateValueByPercentage';

describe('generateValueByPercentage', () => {
  it('returns min at 0%', () => {
    expect(
      generateValueByPercentage({ percentage: 0, range: { min: 5, max: 25 }, decimals: 2 }),
    ).toBe(5);
  });

  it('returns max at 100%', () => {
    expect(
      generateValueByPercentage({ percentage: 1, range: { min: 5, max: 25 }, decimals: 2 }),
    ).toBe(25);
  });

  it('interpolates linearly between min and max', () => {
    expect(
      generateValueByPercentage({ percentage: 0.5, range: { min: 0, max: 10 }, decimals: 2 }),
    ).toBe(5);
    expect(
      generateValueByPercentage({ percentage: 0.25, range: { min: 0, max: 100 }, decimals: 2 }),
    ).toBe(25);
  });

  it('rounds to the requested decimal precision', () => {
    expect(
      generateValueByPercentage({ percentage: 1 / 3, range: { min: 0, max: 1 }, decimals: 2 }),
    ).toBe(0.33);
    expect(
      generateValueByPercentage({ percentage: 1 / 3, range: { min: 0, max: 1 }, decimals: 4 }),
    ).toBe(0.3333);
  });

  it('handles negative ranges', () => {
    expect(
      generateValueByPercentage({ percentage: 0.5, range: { min: -10, max: 10 }, decimals: 2 }),
    ).toBe(0);
  });

  it('does not clamp percentages outside [0, 1]', () => {
    // Documents the current behavior: callers are expected to pre-clamp.
    expect(
      generateValueByPercentage({ percentage: 1.5, range: { min: 0, max: 10 }, decimals: 2 }),
    ).toBe(15);
    expect(
      generateValueByPercentage({ percentage: -0.5, range: { min: 0, max: 10 }, decimals: 2 }),
    ).toBe(-5);
  });
});
