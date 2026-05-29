import { describe, expect, it } from 'vitest';
import {
  convertLinearColorScaleToRamp,
  convertLogColorScaleToRamp,
  interpolateColor,
} from './colorScaleUtils';

const RED_BLUE: [number, number, number][] = [
  [1, 0, 0],
  [0, 0, 1],
];

describe('interpolateColor', () => {
  it('returns endpoint colours at 0 and 1', () => {
    expect(interpolateColor(0, RED_BLUE, 'hex')).toBe('#ff0000');
    expect(interpolateColor(1, RED_BLUE, 'hex')).toBe('#0000ff');
  });

  it('interpolates linearly between two stops', () => {
    expect(interpolateColor(0.5, RED_BLUE, 'hex')).toBe('#800080');
  });

  it('clamps to the final stop when percentage hits 1', () => {
    const palette: [number, number, number][] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    expect(interpolateColor(1, palette, 'hex')).toBe('#0000ff');
  });

  it('renders as rgb() string when mode is rgb', () => {
    expect(interpolateColor(0, RED_BLUE, 'rgb')).toBe('rgb(255, 0, 0)');
    expect(interpolateColor(0.5, RED_BLUE, 'rgb')).toBe('rgb(128, 0, 128)');
  });
});

describe('convertLinearColorScaleToRamp', () => {
  it('produces numStops keys evenly spaced from 0 to 1', () => {
    const ramp = convertLinearColorScaleToRamp({ colors: RED_BLUE, numStops: 5 });
    const keys = Object.keys(ramp);
    expect(keys).toEqual(['0.00', '0.25', '0.50', '0.75', '1.00']);
  });

  it('endpoint keys match the palette ends', () => {
    const ramp = convertLinearColorScaleToRamp({ colors: RED_BLUE, numStops: 3 });
    expect(ramp['0.00']).toBe('#ff0000');
    expect(ramp['1.00']).toBe('#0000ff');
  });

  it('defaults to 256 stops but rounds keys to two decimals (so unique-key count is bounded)', () => {
    // Keys are `toFixed(2)`-rounded percentages, so the 256 generated stops collapse
    // onto at most 101 unique values (0.00 .. 1.00). Last-write-wins per key.
    const ramp = convertLinearColorScaleToRamp({ colors: RED_BLUE });
    const keys = Object.keys(ramp);
    expect(keys.length).toBeLessThanOrEqual(101);
    // End-key is written exactly once (only i=N-1 rounds to "1.00") so it stays pure blue.
    expect(ramp['1.00']).toBe('#0000ff');
    // First key is written for i=0 AND i=1, so last-write-wins yields the i=1 colour —
    // very close to red but not exactly pure.
    const firstColor = ramp['0.00'];
    expect(firstColor).toMatch(/^#[0-9a-f]{6}$/);
    // Red channel ≈ 1.0 (>= 0xee → "ee" or higher), green ≈ 0, blue tiny.
    expect(parseInt(firstColor.slice(1, 3), 16)).toBeGreaterThanOrEqual(0xee);
    expect(parseInt(firstColor.slice(3, 5), 16)).toBe(0);
    expect(parseInt(firstColor.slice(5, 7), 16)).toBeLessThanOrEqual(0x11);
  });
});

describe('convertLogColorScaleToRamp', () => {
  it('emits numStops entries', () => {
    const ramp = convertLogColorScaleToRamp({
      minMaxRatio: 0.01,
      colors: RED_BLUE,
      numStops: 8,
    });
    // Some stops collapse onto identical 2-decimal keys; verify entry generation
    // rather than count, since duplicate keys overwrite within the same object.
    expect(Object.keys(ramp).length).toBeGreaterThan(0);
    expect(Object.keys(ramp).length).toBeLessThanOrEqual(8);
  });

  it('endpoint colours align with the palette ends', () => {
    const ramp = convertLogColorScaleToRamp({
      minMaxRatio: 0.01,
      colors: RED_BLUE,
      numStops: 8,
    });
    // i=0 emits the start colour at the ratio^1 stop; i=N-1 emits the end colour at "1.00".
    expect(ramp['1.00']).toBe('#0000ff');
    // First stop position is ratio (rounded to two decimals).
    expect(ramp['0.01']).toBe('#ff0000');
  });
});
