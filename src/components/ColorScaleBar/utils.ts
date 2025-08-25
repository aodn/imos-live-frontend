import { rgbToHex } from '@/utils';

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
  const values = Array.from(
    { length: numStops },
    (_, i) => min * Math.pow(max / min, i / (numStops - 1)),
  );

  const colorStops: Record<string, string> = {};

  values.forEach(v => {
    // get correct percentage in the color scale based on value. say it is 10 base, 1-10, 10-100, 100-1000. logPercent will be in (0 - 1/3), (1/3 - 2/3), (2/3 - 3/3)
    const logPercent = (Math.log10(v) - Math.log10(min)) / (Math.log10(max) - Math.log10(min));
    //get correct color based on percentage 0-1
    const color = interpolateColor(logPercent, colors, 'hex');
    // this is for webgl texture, say max is 7, then 7 will be 100%, 3.5 will be 50%, 0.07 will be 1%, 0.007 will be 0.1%
    const visualizedPercentage = v / max;

    colorStops[visualizedPercentage.toFixed(2)] = color;
  });

  return colorStops;
}

//get color based on percentage 0-1
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

// get adjusted position for value in [0,1] range, considering threshold and compressedRange
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
    // the remaining space for values above threshold
    const normalizedAboveThreshold =
      (Math.log10(value) - Math.log10(threshold)) / (Math.log10(max) - Math.log10(threshold));
    return compressedRange + normalizedAboveThreshold * (1 - compressedRange);
  }
}
