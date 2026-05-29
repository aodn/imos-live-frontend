import { describe, expect, it } from 'vitest';
import { rgbToHex } from './rgbToHex';

describe('rgbToHex (AtlasRenderingSystem)', () => {
  it('encodes pure colors', () => {
    expect(rgbToHex(1, 0, 0)).toBe('#ff0000');
    expect(rgbToHex(0, 1, 0)).toBe('#00ff00');
    expect(rgbToHex(0, 0, 1)).toBe('#0000ff');
  });

  it('encodes black and white', () => {
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(1, 1, 1)).toBe('#ffffff');
  });

  it('zero-pads single-digit channel values', () => {
    expect(rgbToHex(1 / 255, 0, 0)).toBe('#010000');
  });

  it('rounds fractional channels', () => {
    expect(rgbToHex(0.5, 0.5, 0.5)).toBe('#808080');
  });
});
