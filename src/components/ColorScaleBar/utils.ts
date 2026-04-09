import { rgbToHex } from '@/utils';

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

export function convertLinearColorScaleToRamp({
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
  const values = Array.from(
    { length: numStops },
    (_, i) => min + (max - min) * (i / (numStops - 1)),
  );
  const colorStops: Record<string, string> = {};

  values.forEach(v => {
    const percent = (v - min) / (max - min);
    const color = interpolateColor(percent, colors, 'hex');
    colorStops[percent.toFixed(2)] = color;
  });

  return colorStops;
}

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
  if (mode === 'rgb') return rgbToString(r, g, b);
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
 * Calculates adjusted visual position for logarithmic scales with threshold compression.
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
 * getLogVisualPosition({value: 0.5, min: 0.01, max: 100, threshold: 1.0, compressedRange: 0.1});
 * // Returns: ~0.05 (compressed into first 10% of scale)
 *
 * getLogVisualPosition({value: 10, min: 0.01, max: 100, threshold: 1.0, compressedRange: 0.1});
 * // Returns: ~0.55 (logarithmic position in remaining 90% of scale)
 */ export function getLogVisualPosition({
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
    // Compress the space below threshold, and it is linear space.
    const normalizedInRange = (value - min) / (threshold - min);
    return normalizedInRange * compressedRange;
  } else {
    // the remaining space for values above threshold, this is logarithmic space.
    const normalizedAboveThreshold =
      (Math.log10(value) - Math.log10(threshold)) / (Math.log10(max) - Math.log10(threshold));
    return compressedRange + normalizedAboveThreshold * (1 - compressedRange);
  }
}

/**
 * Calculates the visual position of a value on a symmetric logarithmic (symlog) scale.
 *
 * A symlog scale combines linear scaling for small values near zero with logarithmic
 * scaling for large positive and negative values. This is useful for data that spans
 * several orders of magnitude but includes values close to zero.
 *
 * @param value - The data value to position on the scale
 * @param min - The minimum value of the data range
 * @param max - The maximum value of the data range
 * @param threshold - The threshold value that defines the boundary between linear and logarithmic regions
 * @param compressedRange - The proportion of the visual space (0-1) allocated to the linear region around zero
 * @returns A number between 0 and 1 representing the visual position on the scale
 *
 * @example
 * // Position a value of -100 on a scale from -1000 to 1000 with threshold 10
 * const position = getSymlogVisualPosition(-100, -1000, 1000, 10, 0.2);
 * // Returns a position in the left logarithmic region
 */
export function getSymlogVisualPosition(
  value: number,
  min: number,
  max: number,
  threshold: number,
  compressedRange: number,
): number {
  // get the logarithmic starting positions
  const leftLogEnd = -threshold;
  const rightLogStart = threshold;

  // Position calculation based on region
  if (value <= leftLogEnd) {
    // Left logarithmic region
    const logRange = Math.log10(-min / threshold);
    const logValue = Math.log10(-value / threshold);
    const posInLeftLog = 1 - logValue / logRange;
    return posInLeftLog * ((1 - compressedRange) / 2);
  } else if (value >= rightLogStart) {
    // Right logarithmic region
    const logRange = Math.log10(max / threshold);
    const logValue = Math.log10(value / threshold);
    const posInRightLog = logValue / logRange;
    return (1 + compressedRange) / 2 + posInRightLog * ((1 - compressedRange) / 2);
  } else {
    // Linear region (between -threshold and threshold)
    const linearRange = 2 * threshold;
    const posInLinear = (value + threshold) / linearRange;
    return (1 - compressedRange) / 2 + posInLinear * compressedRange;
  }
}

/**
 * Generates appropriate tick marks for a symmetric logarithmic scale.
 *
 * Creates a set of tick values that provide meaningful reference points across
 * both the linear (near zero) and logarithmic (large magnitude) regions of the scale.
 * Includes major ticks at powers of 10 and optional intermediate ticks at specified multipliers.
 *
 * @param min - The minimum value of the data range
 * @param max - The maximum value of the data range
 * @param threshold - The threshold value that defines the boundary between linear and logarithmic regions
 * @param intermediateTicks - Array of multipliers (e.g., [2, 5]) to create intermediate ticks between powers of 10
 * @returns Sorted array of tick values covering the data range
 *
 * @example
 * // Generate ticks for a range from -1000 to 1000 with threshold 10
 * const ticks = generateSymlogTicks(-1000, 1000, 10, [2, 5]);
 * // Returns: [-1000, -500, -200, -100, -50, -20, -10, 0, 10, 20, 50, 100, 200, 500, 1000]
 */
export function generateSymlogTicks(
  min: number,
  max: number,
  threshold: number,
  intermediateTicks: number[] = [],
): number[] {
  const ticks: number[] = [];

  // include zero as it's the center point of symlog
  if (min <= 0 && max >= 0) {
    ticks.push(0);
  }

  // include threshold boundaries if they're within range
  if (-threshold >= min && -threshold <= max) {
    ticks.push(-threshold);
  }
  if (threshold >= min && threshold <= max) {
    ticks.push(threshold);
  }

  // generate negative logarithmic ticks (left side) - only for values < -threshold
  if (min < -threshold) {
    const logMinAbs = Math.log10(Math.abs(min));
    const logThreshold = Math.log10(threshold);

    //  ticks (powers of 10) on negative side
    for (let power = Math.floor(logThreshold); power <= Math.ceil(logMinAbs); power++) {
      const value = -Math.pow(10, power);
      if (value >= min && value <= -threshold) {
        ticks.push(value);
      }
    }

    // intermediate ticks on negative side
    for (let power = Math.floor(logThreshold); power < Math.ceil(logMinAbs); power++) {
      const base = Math.pow(10, power);
      intermediateTicks.forEach(mult => {
        const value = -base * mult;
        if (value >= min && value <= -threshold && !ticks.includes(value)) {
          ticks.push(value);
        }
      });
    }
  }

  // positive logarithmic ticks (right side) - only for values > threshold
  if (max > threshold) {
    const logMax = Math.log10(max);
    const logThreshold = Math.log10(threshold);

    // ticks (powers of 10) on positive side
    for (let power = Math.floor(logThreshold); power <= Math.ceil(logMax); power++) {
      const value = Math.pow(10, power);
      if (value >= threshold && value <= max) {
        ticks.push(value);
      }
    }

    // intermediate ticks on positive side
    for (let power = Math.floor(logThreshold); power < Math.ceil(logMax); power++) {
      const base = Math.pow(10, power);
      intermediateTicks.forEach(mult => {
        const value = base * mult;
        if (value >= threshold && value <= max && !ticks.includes(value)) {
          ticks.push(value);
        }
      });
    }
  }

  if (!ticks.includes(min)) ticks.push(min);
  if (!ticks.includes(max)) ticks.push(max);

  return [...new Set(ticks)].sort((a, b) => a - b);
}

/**
 * Formats a numeric value for display as a tick label.
 *
 * Applies appropriate formatting rules to make tick labels readable:
 * - Small values (< 1): shown with 1 decimal place
 * - Whole numbers: shown without decimals
 * - Other values: rounded to 2 decimal places, shown with 1 decimal if needed
 *
 * @param value - The numeric value to format
 * @returns Formatted string representation of the value
 *
 * @example
 * formatTickValue(0.5);    // "0.5"
 * formatTickValue(100);    // "100"
 * formatTickValue(123.456); // "123.5"
 * formatTickValue(0);  // "0"
 */
export function formatTickValue(value: number): string {
  if (Math.abs(value) < 1 && value !== 0) return value.toFixed(1).toString();
  if (Math.round(value * 100) % 100 === 0) return (Math.round(value * 100) / 100).toString();
  return (Math.round(value * 100) / 100).toFixed(1).toString();
}

type TickPosition = {
  index: number;
  value: number;
  position: number;
  label: string;
  isEdge: boolean;
};

/**
 * Applies spacing guard logic to prevent tick labels from overlapping.
 *
 * Removes ticks that are too close to the edge ticks (min/max values) to prevent
 * visual crowding and overlapping labels. This ensures the scale remains readable
 * even when many ticks are generated.
 *
 * @param tickPositions - Array of tick position objects to filter
 * @param guardSpace - the minimum space (in percentage) required between edge ticks and adjacent ticks
 * @returns Filtered array with potentially overlapping ticks removed
 *
 * @example
 * const filtered = applyTickGuard(allTicks);
 * // Returns ticks with adequate spacing from edges
 */
export function applyTickGuard(
  tickPositions: TickPosition[],
  guardSpace: number = 5,
): TickPosition[] {
  const edges = tickPositions.filter(tick => tick.isEdge);
  return tickPositions.filter((tick, index) => {
    const [startEdge, endEdge] = edges;

    if (index === startEdge.index + 1) {
      if (Math.abs(startEdge.position - tick.position) < guardSpace) {
        return false;
      }
    }
    if (index === endEdge.index - 1) {
      if (Math.abs(tick.position - endEdge.position) < guardSpace) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Calculates the normalized position of a value within a logarithmic color scale.
 *
 * This function maps a data value to a position in the [0, 1] range for color interpolation
 * using logarithmic scaling. All values must be positive as logarithms of negative numbers
 * are undefined.
 *
 * The mapping preserves logarithmic relationships, meaning that values with the same
 * logarithmic ratio will have the same visual color distance. For example, the color
 * difference between 1 and 10 will be the same as between 10 and 100.
 *
 * @param value - The data value to normalize (must be > 0)
 * @param min - The minimum value of the data range (must be > 0)
 * @param max - The maximum value of the data range (must be > 0 and > min)
 * @returns A value between 0 and 1 representing the position in the color scale
 *
 * @example
 * // For a range from 1 to 1000
 * getLogColorPosition(1, 1, 1000);    // Returns 0.0 (start of color scale)
 * getLogColorPosition(10, 1, 1000);   // Returns 0.333... (1/3 through color scale)
 * getLogColorPosition(100, 1, 1000);  // Returns 0.666... (2/3 through color scale)
 * getLogColorPosition(1000, 1, 1000); // Returns 1.0 (end of color scale)
 *
 * @example
 * // Using with color interpolation
 * const colorPos = getLogColorPosition(50, 1, 1000);
 * const color = interpolateColor(colorPos, colorPalette);
 */
export function getLogColorPosition(value: number, min: number, max: number): number {
  return (Math.log10(value) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
}

/**
 * Calculates the normalized position of a value within a symmetric logarithmic (symlog) color scale.
 *
 * This function maps a data value to a position in the [0, 1] range for color interpolation
 * using symmetric logarithmic scaling. Unlike pure logarithmic scaling, symlog can handle
 * negative values and provides linear scaling near zero for better visualization of small values.
 *
 * The symlog transformation consists of three regions:
 * - Linear region: |value| ≤ threshold - scaled linearly to preserve small value differences
 * - Positive log region: value > threshold - scaled logarithmically for large positive values
 * - Negative log region: value < -threshold - scaled logarithmically for large negative values
 *
 * This normalization matches Python's matplotlib SymLogNorm behavior, ensuring consistent
 * color mapping between different visualization tools.
 *
 * @param value - The data value to normalize (can be any real number)
 * @param min - The minimum value of the data range
 * @param max - The maximum value of the data range (must be > min)
 * @param threshold - The threshold value defining the boundary between linear and logarithmic regions (must be > 0)
 * @returns A value between 0 and 1 representing the position in the color scale
 *
 * @example
 * // For a range from -100 to 100 with threshold 1
 * getSymlogColorPosition(-100, -100, 100, 1);  // Returns 0.0 (start of color scale)
 * getSymlogColorPosition(-1, -100, 100, 1);    // Returns ~0.25 (end of negative log region)
 * getSymlogColorPosition(0, -100, 100, 1);     // Returns 0.5 (center of linear region)
 * getSymlogColorPosition(1, -100, 100, 1);     // Returns ~0.75 (start of positive log region)
 * getSymlogColorPosition(100, -100, 100, 1);   // Returns 1.0 (end of color scale)
 *
 * @example
 * // Using with color interpolation for oceanographic data
 * const colorPos = getSymlogColorPosition(seaLevelAnomaly, -1.2, 1.2, 0.1);
 * const color = interpolateColor(colorPos, oceanColorPalette);
 *
 * @example
 * // Comparing with linear scaling
 * const linearPos = (value - min) / (max - min);        // Linear color mapping
 * const symlogPos = getSymlogColorPosition(value, min, max, threshold); // Symlog color mapping
 * // symlogPos will emphasize differences in large magnitude values more than linearPos
 */
export function getSymlogColorPosition(
  value: number,
  min: number,
  max: number,
  threshold: number,
): number {
  const normalizeSymlog = (val: number) => {
    if (Math.abs(val) <= threshold) {
      // linear region: normalize within [-threshold, threshold] to [-1, 1]
      return val / threshold;
    } else {
      // logarithmic region
      const sign = Math.sign(val);
      const logVal = Math.log10(Math.abs(val) / threshold);
      return sign * (1 + logVal);
    }
  };

  const normalizedValue = normalizeSymlog(value);
  const normalizedMin = normalizeSymlog(min);
  const normalizedMax = normalizeSymlog(max);

  // map to [0, 1] range for color interpolation
  return (normalizedValue - normalizedMin) / (normalizedMax - normalizedMin);
}
