import { describe, expect, it } from 'vitest';
import { isPointInBounds } from './isPointInBounds';

// GSLA-like bounds: cross the antimeridian on the east side.
const CROSSING = { lonMin: 57, lonMax: 185, latMin: -58, latMax: -7 };
// Bounds wholly inside [-180, 180].
const PLAIN = { lonMin: 100, lonMax: 160, latMin: -45, latMax: -10 };

describe('isPointInBounds', () => {
  it('accepts a point inside ordinary bounds', () => {
    expect(isPointInBounds(PLAIN, 130, -30)).toBe(true);
  });

  it('rejects a point west or east of ordinary bounds', () => {
    expect(isPointInBounds(PLAIN, 90, -30)).toBe(false);
    expect(isPointInBounds(PLAIN, 170, -30)).toBe(false);
  });

  it('rejects a point outside the latitude range', () => {
    expect(isPointInBounds(PLAIN, 130, -50)).toBe(false);
    expect(isPointInBounds(PLAIN, 130, -5)).toBe(false);
  });

  it('includes the bounds edges', () => {
    expect(isPointInBounds(PLAIN, 100, -45)).toBe(true);
    expect(isPointInBounds(PLAIN, 160, -10)).toBe(true);
  });

  it('accepts a wrapped lng east of the antimeridian for crossing bounds', () => {
    // -178 wrapped == 182 unwrapped, inside 57..185.
    expect(isPointInBounds(CROSSING, -178, -30)).toBe(true);
    // -175 == 185, exactly on lonMax.
    expect(isPointInBounds(CROSSING, -175, -30)).toBe(true);
  });

  it('rejects a wrapped lng beyond the eastern edge of crossing bounds', () => {
    // -174 == 186, just past lonMax.
    expect(isPointInBounds(CROSSING, -174, -30)).toBe(false);
  });

  it('still accepts the 180° meridian itself for crossing bounds', () => {
    expect(isPointInBounds(CROSSING, 180, -30)).toBe(true);
    expect(isPointInBounds(CROSSING, -180, -30)).toBe(true);
  });

  it('does not unwrap a lng west of lonMin into range for ordinary bounds', () => {
    // 90 + 360 = 450 is outside 100..160, so this must stay false.
    expect(isPointInBounds(PLAIN, 90, -30)).toBe(false);
  });
});
