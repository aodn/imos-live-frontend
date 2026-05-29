import { describe, expect, it } from 'vitest';
import { addYears, minusYears } from './addYears';

describe('addYears', () => {
  it('adds whole years', () => {
    expect(addYears(new Date('2026-05-29T00:00:00Z'), 2).getUTCFullYear()).toBe(2028);
  });

  it('does not mutate the input', () => {
    const original = new Date('2026-05-29T00:00:00Z');
    const snapshot = original.getTime();
    addYears(original, 5);
    expect(original.getTime()).toBe(snapshot);
  });

  it('handles negative input by going backward', () => {
    expect(addYears(new Date('2026-05-29T00:00:00Z'), -1).getUTCFullYear()).toBe(2025);
  });

  it('leap day rolls forward to March 1 in a non-leap year', () => {
    // 2024-02-29 + 1 year → JS setFullYear normalizes the invalid 2025-02-29 to 2025-03-01.
    const result = addYears(new Date('2024-02-29T00:00:00Z'), 1);
    expect(result.getUTCMonth()).toBe(2); // March
    expect(result.getUTCDate()).toBe(1);
  });
});

describe('minusYears', () => {
  it('subtracts whole years', () => {
    expect(minusYears(new Date('2026-05-29T00:00:00Z'), 3).getUTCFullYear()).toBe(2023);
  });

  it('does not mutate the input', () => {
    const original = new Date('2026-05-29T00:00:00Z');
    const snapshot = original.getTime();
    minusYears(original, 5);
    expect(original.getTime()).toBe(snapshot);
  });
});
