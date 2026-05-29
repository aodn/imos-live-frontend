import { describe, expect, it } from 'vitest';
import { snapToClosestStep } from './snapToClosestStep';

describe('snapToClosestStep', () => {
  const steps = [0, 20, 40, 60];

  it('snaps to the closest step', () => {
    expect(snapToClosestStep(27, steps)).toBe(20);
    expect(snapToClosestStep(33, steps)).toBe(40);
  });

  it('returns the exact step when value matches', () => {
    expect(snapToClosestStep(40, steps)).toBe(40);
  });

  it('prefers the first equally-distant step encountered', () => {
    // 10 is equidistant from 0 and 20 — the loop only updates on strictly smaller distance,
    // so the earlier element (0) wins. Locking this in so the contract is visible.
    expect(snapToClosestStep(10, steps)).toBe(0);
  });

  it('clamps to first step when value is far below', () => {
    expect(snapToClosestStep(-100, steps)).toBe(0);
  });

  it('clamps to last step when value is far above', () => {
    expect(snapToClosestStep(1000, steps)).toBe(60);
  });
});
