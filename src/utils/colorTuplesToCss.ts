import { rgbToHex } from './rgbToHex';

/**
 * Convert an array of RGB float tuples (values in [0, 1]) to an array of
 * CSS hex color strings suitable for use with LinearColorScaleBar.
 *
 * @example
 * colorTuplesToCss(PRODUCTLEGENDS['gsla-anomaly-sea-levels-webgl'].colors)
 * // → ['#000000', '#00007f', ..., '#7f0000']
 */
export function colorTuplesToCss(colors: [number, number, number][]): string[] {
  return colors.map(([r, g, b]) => rgbToHex(r, g, b));
}
