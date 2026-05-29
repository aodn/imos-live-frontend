import { describe, expect, it } from 'vitest';
import { hexToRgbArray, rgbToHex } from './rgbToHex';

describe('rgbToHex', () => {
  it('encodes pure colors', () => {
    expect(rgbToHex(1, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 1, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 1)).toBe('#0000ff');
  });

  it('encodes black and white', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(1, 1, 1)).toBe('#ffffff');
  });

  it('zero-pads single-digit channels', () => {
    // 1/255 → 1 → "1" → padded to "01".
    expect(rgbToHex(1 / 255, 0, 0)).toBe('#010000');
  });

  it('rounds fractional channels', () => {
    expect(rgbToHex(0.5, 0.5, 0.5)).toBe('#808080');
  });
});

describe('hexToRgbArray', () => {
  it('decodes 6-digit hex', () => {
    expect(hexToRgbArray('#ff0000')).toEqual([1, 0, 0]);
    expect(hexToRgbArray('#000000')).toEqual([0, 0, 0]);
    expect(hexToRgbArray('#ffffff')).toEqual([1, 1, 1]);
  });

  it('expands shorthand 3-digit hex', () => {
    expect(hexToRgbArray('#fff')).toEqual([1, 1, 1]);
    expect(hexToRgbArray('#f00')).toEqual([1, 0, 0]);
  });

  it('accepts hex without leading #', () => {
    expect(hexToRgbArray('ff0000')).toEqual([1, 0, 0]);
  });

  it('throws on invalid length', () => {
    expect(() => hexToRgbArray('#ff00')).toThrow('Invalid hex color');
    expect(() => hexToRgbArray('#1234567')).toThrow('Invalid hex color');
  });

  it('round-trips with rgbToHex', () => {
    const original: [number, number, number] = [0.25, 0.5, 0.75];
    const decoded = hexToRgbArray(rgbToHex(...original));
    expect(decoded[0]).toBeCloseTo(original[0], 2);
    expect(decoded[1]).toBeCloseTo(original[1], 2);
    expect(decoded[2]).toBeCloseTo(original[2], 2);
  });
});
