import { describe, expect, it } from 'vitest';
import { getScaledDimensions } from './getScaledDimensions';

describe('getScaledDimensions', () => {
  it('scales by width keeping aspect ratio', () => {
    // 200×100 intrinsic, target width 100 → height 50.
    expect(
      getScaledDimensions({ by: 'width', value: 100, intrinsicWidth: 200, intrinsicHeight: 100 }),
    ).toEqual({ width: 100, height: 50 });
  });

  it('scales by height keeping aspect ratio', () => {
    expect(
      getScaledDimensions({ by: 'height', value: 50, intrinsicWidth: 200, intrinsicHeight: 100 }),
    ).toEqual({ width: 100, height: 50 });
  });

  it('rounds to integer pixels', () => {
    expect(
      getScaledDimensions({ by: 'width', value: 100, intrinsicWidth: 300, intrinsicHeight: 100 }),
    ).toEqual({ width: 100, height: 33 });
  });

  it('throws on invalid "by"', () => {
    expect(() =>
      getScaledDimensions({
        // @ts-expect-error — testing invalid input
        by: 'depth',
        value: 10,
        intrinsicWidth: 10,
        intrinsicHeight: 10,
      }),
    ).toThrow('Invalid "by" argument');
  });
});
