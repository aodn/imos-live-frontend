import { describe, expect, it } from 'vitest';
import { getFirstAndLast } from './getFirstAndLast';

describe('getFirstAndLast', () => {
  it('returns first and last for a multi-element array', () => {
    expect(getFirstAndLast([1, 2, 3, 4, 5])).toEqual([1, 5]);
  });

  it('returns the single element for a 1-element array', () => {
    expect(getFirstAndLast(['only'])).toEqual(['only']);
  });

  it('returns [] for an empty array', () => {
    expect(getFirstAndLast([])).toEqual([]);
  });

  it('returns [] for a non-array input', () => {
    // @ts-expect-error — testing the runtime guard
    expect(getFirstAndLast(null)).toEqual([]);
  });
});
