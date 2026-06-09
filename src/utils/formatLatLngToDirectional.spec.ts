import { describe, expect, it } from 'vitest';
import { formatLatLngToDirectional } from './formatLatLngToDirectional';

describe('formatLatLngToDirectional', () => {
  it('formats southern hemisphere / eastern hemisphere (Australian default)', () => {
    expect(formatLatLngToDirectional(-38.38, 142.29)).toBe('38.38S, 142.29E');
  });

  it('formats northern + western', () => {
    expect(formatLatLngToDirectional(45.12, -73.45)).toBe('45.12N, 73.45W');
  });

  it('omits the direction letter at exactly 0', () => {
    expect(formatLatLngToDirectional(0, 0)).toBe('0.00, 0.00');
    expect(formatLatLngToDirectional(0, 100)).toBe('0.00, 100.00E');
    expect(formatLatLngToDirectional(-30, 0)).toBe('30.00S, 0.00');
  });

  it('respects custom decimals', () => {
    expect(formatLatLngToDirectional(-33.867, 151.207, 3)).toBe('33.867S, 151.207E');
    expect(formatLatLngToDirectional(-33.867, 151.207, 0)).toBe('34S, 151E');
  });

  it('returns empty string for NaN inputs', () => {
    expect(formatLatLngToDirectional(NaN, 100)).toBe('');
    expect(formatLatLngToDirectional(0, NaN)).toBe('');
  });
});
