import { describe, expect, it } from 'vitest';
import { clamp, clampPercent } from './clamp';

describe('clamp', () => {
  it('returns value when inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps below to min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });

  it('clamps above to max', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });

  it('returns value at the boundary', () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('swaps min and max when called with them reversed', () => {
    expect(clamp(5, 10, 0)).toBe(5);
    expect(clamp(-3, 10, 0)).toBe(0);
    expect(clamp(99, 10, 0)).toBe(10);
  });

  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-20, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

describe('clampPercent', () => {
  it('clamps to [0, 100] by default', () => {
    expect(clampPercent(50)).toBe(50);
    expect(clampPercent(-10)).toBe(0);
    expect(clampPercent(150)).toBe(100);
  });

  it('accepts a custom max', () => {
    expect(clampPercent(50, 40)).toBe(40);
    expect(clampPercent(20, 40)).toBe(20);
  });
});
