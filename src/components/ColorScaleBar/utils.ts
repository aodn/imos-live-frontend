import { rgbToHex } from '@/utils';

/**
 * Converts a logarithmic color scale to a color ramp suitable for WebGL textures.
 *
 * This function creates color stops for a logarithmic scale where values are distributed
 * exponentially (e.g., 1, 10, 100, 1000) but visualized with linear percentage mapping.
 *
 * @param {number} params.min - Minimum value of the data range
 * @param {number} params.max - Maximum value of the data range
 * @param {[number, number, number][]} params.colors - Array of RGB color values (normalized 0-1)
 * @param {number} params.numStops - Number of color stops to generate
 *
 * @returns {Record<string, string>} Object mapping percentage strings to hex colors
 *
 * @example
 * // For current speed data ranging 0.1 to 100 m/s with 10 stops:
 * const colorRamp = convertLogColorScaleToRamp({
 *   min: 0.1,
 *   max: 100,
 *   colors: [[0.0, 0.0, 1.0], [1.0, 0.0, 0.0]],
 *   numStops: 10
 * });
 *  // Returns: { "0.00": "#0000ff", "0.10": "#1a00e6", ..., "1.00": "#ff0000" }
 */
export function convertLogColorScaleToRamp({
  min,
  max,
  colors,
  numStops,
}: {
  min: number;
  max: number;
  numStops: number;
  colors: [number, number, number][];
}): Record<string, string> {
  // Generate logarithmically distributed values
  // For min=1, max=1000, numStops=4: generates [1, 10, 100, 1000]
  const values = Array.from(
    { length: numStops },
    (_, i) => min * Math.pow(max / min, i / (numStops - 1)),
  );

  const colorStops: Record<string, string> = {};

  values.forEach(v => {
    // get correct percentage in the color scale based on value. say it is 10 base, 1-10, 10-100, 100-1000. logPercent will be in (0 - 1/3), (1/3 - 2/3), (2/3 - 3/3)
    const logPercent = (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
    // get correct color based on percentage 0-1
    const color = interpolateColor(logPercent, colors, 'hex');
    // this is for webgl texture, say max is 7, then 7 will be 100%, 3.5 will be 50%, 0.07 will be 1%, 0.007 will be 0.1%
    const visualizedPercentage = v / max;

    colorStops[visualizedPercentage.toFixed(2)] = color;
  });

  return colorStops;
}

/**
 * Interpolates between colors in a palette based on a percentage value.
 *
 * Uses linear interpolation (lerp) between adjacent colors in the palette.
 * Handles edge cases where percentage maps exactly to palette boundaries.
 *
 * @param {number} percentage - Value between 0-1 indicating position in palette
 * @param {[number, number, number][]} colorPalette - Array of RGB colors (normalized 0-1)
 * @param {'rgb' | 'hex'} mode - Output format for the color
 *
 * @returns {string} Interpolated color in requested format
 *
 * @example
 * const palette = [[0, 0, 1], [1, 0, 0]]; // Blue to red
 * interpolateColor(0.5, palette, 'hex'); // Returns "#800080" (purple)
 * interpolateColor(0.25, palette, 'rgb'); // Returns "rgb(64, 0, 191)"
 */
export function interpolateColor(
  percentage: number,
  colorPalette: [number, number, number][],
  mode: 'rgb' | 'hex' = 'rgb',
): string {
  const idx = percentage * (colorPalette.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(i0 + 1, colorPalette.length - 1);
  const frac = idx - i0;

  const c0 = colorPalette[i0];
  const c1 = colorPalette[i1];
  const r = (1 - frac) * c0[0] + frac * c1[0];
  const g = (1 - frac) * c0[1] + frac * c1[1];
  const b = (1 - frac) * c0[2] + frac * c1[2];
  if (mode === 'rgb')
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  return rgbToHex(r, g, b);
}

/**
 * Generates tick marks for logarithmic scales, excluding values below a threshold.
 *
 * Creates major ticks at powers of 10 and optional intermediate ticks (like 2, 5)
 * between powers. Useful for creating readable logarithmic axis labels.
 *
 * @param {number} min - Minimum value of the range
 * @param {number} max - Maximum value of the range
 * @param {number} threshold - Minimum value to include (filters out small values)
 * @param {number[]} intermediateTicks - Multipliers for intermediate ticks (e.g., [2, 5])
 *
 * @returns {number[]} Sorted array of tick values
 *
 * @example
 * // Generate ticks for range 0.01 to 1000, showing values ≥ 0.1
 * const ticks = generateLogTicks(0.01, 1000, 0.1, [2, 5]);
 * // Returns: [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000]
 */
export function generateLogTicks(
  min: number,
  max: number,
  threshold: number,
  intermediateTicks: number[],
): number[] {
  const ticks: number[] = [];
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);

  // major ticks (powers of 10)
  for (let power = Math.floor(logMin); power <= Math.ceil(logMax); power++) {
    const value = Math.pow(10, power);
    if (value >= min && value <= max && value >= threshold) {
      ticks.push(value);
    }
  }

  // add intermediate ticks
  for (let power = Math.floor(logMin); power < Math.ceil(logMax); power++) {
    const base = Math.pow(10, power);
    intermediateTicks.forEach(mult => {
      const value = base * mult;
      if (value >= min && value <= max && value >= threshold && !ticks.includes(value)) {
        ticks.push(value);
      }
    });
  }

  // include the exact min and max values if they're >= 0.1
  if (min >= threshold && !ticks.includes(min)) ticks.push(min);
  if (!ticks.includes(max)) ticks.push(max);

  return ticks.sort((a, b) => a - b);
}

/**
 * Calculates adjusted position for logarithmic scales with threshold compression.
 *
 * Values below the threshold are compressed into a small linear space, while values
 * above the threshold use logarithmic spacing. This prevents very small values from
 * being invisible while maintaining logarithmic distribution for larger values.
 *
 * @param {number} params.value - The value to position
 * @param {number} params.min - Minimum value of the full range
 * @param {number} params.max - Maximum value of the full range
 * @param {number} params.threshold - Threshold value separating linear and log regions
 * @param {number} params.compressedRange - Fraction of space (0-1) allocated to sub-threshold values
 *
 * @returns {number} Position value between 0-1
 *
 * @example
 * // For wind speed range 0.01-100 m/s with threshold=1.0, compressedRange=0.1:
 * getAdjustedPosition({value: 0.5, min: 0.01, max: 100, threshold: 1.0, compressedRange: 0.1});
 * // Returns: ~0.05 (compressed into first 10% of scale)
 *
 * getAdjustedPosition({value: 10, min: 0.01, max: 100, threshold: 1.0, compressedRange: 0.1});
 * // Returns: ~0.55 (logarithmic position in remaining 90% of scale)
 */ export function getAdjustedPosition({
  value,
  min,
  max,
  threshold,
  compressedRange,
}: {
  value: number;
  min: number;
  max: number;
  threshold: number;
  compressedRange: number;
}): number {
  if (value <= threshold) {
    // Compress the space below threshold
    const normalizedInRange = (value - min) / (threshold - min);
    return normalizedInRange * compressedRange;
  } else {
    // the remaining space for values above threshold
    const normalizedAboveThreshold =
      (Math.log10(value) - Math.log10(threshold)) / (Math.log10(max) - Math.log10(threshold));
    return compressedRange + normalizedAboveThreshold * (1 - compressedRange);
  }
}
