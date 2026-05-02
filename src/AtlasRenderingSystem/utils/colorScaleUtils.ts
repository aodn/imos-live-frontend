import { rgbToHex } from './rgbToHex';

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

export function convertLinearColorScaleToRamp({
  colors,
  numStops = 256,
}: {
  numStops?: number;
  colors: [number, number, number][];
}): Record<string, string> {
  const colorStops: Record<string, string> = {};
  for (let i = 0; i < numStops; i++) {
    const percent = i / (numStops - 1);
    colorStops[percent.toFixed(2)] = interpolateColor(percent, colors, 'hex');
  }
  return colorStops;
}

// minMaxRatio = min / max (e.g. 0.01/3.0 ≈ 0.003). Only the ratio matters because
// logPercent = i/(N-1) and visualizedPercentage = ratio^((N-1-i)/(N-1)) are both
// independent of the individual min/max values.
export function convertLogColorScaleToRamp({
  minMaxRatio,
  colors,
  numStops = 256,
}: {
  minMaxRatio: number;
  numStops?: number;
  colors: [number, number, number][];
}): Record<string, string> {
  const colorStops: Record<string, string> = {};
  for (let i = 0; i < numStops; i++) {
    const logPercent = i / (numStops - 1);
    const visualizedPercentage = Math.pow(minMaxRatio, (numStops - 1 - i) / (numStops - 1));
    colorStops[visualizedPercentage.toFixed(2)] = interpolateColor(logPercent, colors, 'hex');
  }
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
  if (mode === 'rgb') return rgbToString(r, g, b);
  return rgbToHex(r, g, b);
}
