import { describe, expect, it } from 'vitest';
import { degreesToCompass, generateSpeed, velocityToReadable } from './velocityDegreeProcessing';

describe('degreesToCompass', () => {
  // Cartesian polar coordinates: 0°=E, 90°=N, 180°=W, 270°=S — 8-way buckets every 45°.
  const cardinalCases: { u: number; v: number; direction: string; degree: number }[] = [
    { u: 1, v: 0, direction: 'E', degree: 0 },
    { u: 1, v: 1, direction: 'NE', degree: 45 },
    { u: 0, v: 1, direction: 'N', degree: 90 },
    { u: -1, v: 1, direction: 'NW', degree: 135 },
    { u: -1, v: 0, direction: 'W', degree: 180 },
    { u: -1, v: -1, direction: 'SW', degree: 225 },
    { u: 0, v: -1, direction: 'S', degree: 270 },
    { u: 1, v: -1, direction: 'SE', degree: 315 },
  ];

  for (const c of cardinalCases) {
    it(`u=${c.u}, v=${c.v} → ${c.direction} @ ${c.degree}°`, () => {
      const result = degreesToCompass(c.u, c.v);
      expect(result.direction).toBe(c.direction);
      expect(result.degree).toBeCloseTo(c.degree, 5);
    });
  }

  it('normalizes negative atan2 results into [0, 360)', () => {
    // v = -0.0001 gives atan2 a tiny negative angle that must wrap to ~360.
    const result = degreesToCompass(1, -0.0001);
    expect(result.degree).toBeGreaterThanOrEqual(0);
    expect(result.degree).toBeLessThan(360);
  });

  it('rounds 22.5° (boundary between E and NE) up to NE', () => {
    // Math.round in JS rounds 0.5 toward +∞, so the boundary at 22.5° lands on NE.
    const u = Math.cos((22.5 * Math.PI) / 180);
    const v = Math.sin((22.5 * Math.PI) / 180);
    expect(degreesToCompass(u, v).direction).toBe('NE');
  });

  it('wraps 360° back to E via mod 8', () => {
    // Exactly +x axis — angle 0 maps to E, not a non-existent 9th bucket.
    expect(degreesToCompass(1, 0).direction).toBe('E');
  });

  it('u=0, v=0 returns a valid direction (does not crash)', () => {
    const result = degreesToCompass(0, 0);
    expect(['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE']).toContain(result.direction);
    expect(Number.isFinite(result.degree)).toBe(true);
  });
});

describe('generateSpeed', () => {
  it('returns magnitude of (u, v)', () => {
    expect(generateSpeed(3, 4)).toBe(5);
    expect(generateSpeed(0, 0)).toBe(0);
    expect(generateSpeed(-3, -4)).toBe(5);
  });

  it('handles unit vectors', () => {
    expect(generateSpeed(1, 0)).toBe(1);
    expect(generateSpeed(0, 1)).toBe(1);
  });
});

describe('velocityToReadable', () => {
  it('combines speed, direction, and degree', () => {
    // This is the contract the E2E ocean-current popup test depends on.
    const result = velocityToReadable(1, 0);
    expect(result).toEqual({ speed: 1, direction: 'E', degree: 0 });
  });

  it('matches E2E expectation: speed=2, u=2, v=0 → E @ 0°', () => {
    const result = velocityToReadable(2, 0);
    expect(result.speed).toBe(2);
    expect(result.direction).toBe('E');
    expect(result.degree).toBe(0);
  });
});
