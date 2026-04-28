import { COLOR_OPTIONS } from '@/config';
import type { LegendArgs } from '@/constants';
import type { ColorPalette } from '@/layers';

export function buildProductPalette(legend: LegendArgs): ColorPalette {
  return {
    scale: legend.scale,
    rawColors: COLOR_OPTIONS[legend.colorKey],
    legendRange: legend.range as [number, number],
  };
}
