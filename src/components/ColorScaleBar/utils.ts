import { rgbToHex } from '@/utils';

export function convertLogColorScaleToRamp({
  min,
  max,
  colors,
  threshold,
  compressedRange,
  numStops,
}: {
  min: number;
  max: number;
  threshold: number;
  compressedRange: number;
  numStops: number;
  colors: [number, number, number][];
}): Record<string, string> {
  const values = Array.from(
    { length: numStops },
    (_, i) => min * Math.pow(max / min, i / (numStops - 1)),
  );

  const colorStops: Record<string, string> = {};

  values.forEach(v => {
    const adjustedPercent = getAdjustedPosition({ value: v, min, max, threshold, compressedRange });
    // Map color based on the logarithmic value position, not visual position
    const logPercent = (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
    const color = interpolateColor(logPercent, colors, 'hex');

    colorStops[adjustedPercent.toFixed(2)] = color;
  });

  return colorStops;
}

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

// exclude ticks smaller than threshold
export function generateLogTicks(
  min: number,
  max: number,
  threshold: number,
  intermediateTicks: number[],
): number[] {
  const ticks: number[] = [];
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);

  // Generate major ticks (powers of 10)
  for (let power = Math.floor(logMin); power <= Math.ceil(logMax); power++) {
    const value = Math.pow(10, power);
    if (value >= min && value <= max && value >= threshold) {
      ticks.push(value);
    }
  }

  // Add intermediate ticks
  for (let power = Math.floor(logMin); power < Math.ceil(logMax); power++) {
    const base = Math.pow(10, power);
    intermediateTicks.forEach(mult => {
      const value = base * mult;
      if (value >= min && value <= max && value >= threshold && !ticks.includes(value)) {
        ticks.push(value);
      }
    });
  }

  // Always include the exact min and max values if they're >= 0.1
  if (min >= threshold && !ticks.includes(min)) ticks.push(min);
  if (!ticks.includes(max)) ticks.push(max);

  return ticks.sort((a, b) => a - b);
}

export function getAdjustedPosition({
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
    // Use the remaining space for values above threshold
    const normalizedAboveThreshold =
      (Math.log10(value) - Math.log10(threshold)) / (Math.log10(max) - Math.log10(threshold));
    return compressedRange + normalizedAboveThreshold * (1 - compressedRange);
  }
}
