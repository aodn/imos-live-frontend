import { describe, expect, it } from 'vitest';
import { clampToLowerBound } from './clampToLowerBound';

describe('clampToLowerBound', () => {
  const steps = [0, 20, 40, 60];

  it('returns the matching step when value equals one', () => {
    expect(clampToLowerBound(20, steps)).toBe(20);
    expect(clampToLowerBound(40, steps)).toBe(40);
  });

  it('floors to the previous step when between two', () => {
    expect(clampToLowerBound(30, steps)).toBe(20);
    expect(clampToLowerBound(59, steps)).toBe(40);
  });

  it('returns the first step when value is below all steps', () => {
    // Below the smallest step still returns the smallest — this is a "lower bound" floor.
    expect(clampToLowerBound(-10, steps)).toBe(0);
  });

  it('returns the last step when value is above all steps', () => {
    expect(clampToLowerBound(1000, steps)).toBe(60);
  });

  it('handles a single-element array', () => {
    expect(clampToLowerBound(5, [10])).toBe(10);
    expect(clampToLowerBound(15, [10])).toBe(10);
  });
});
