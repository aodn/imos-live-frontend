import { COLOR_OPTIONS } from '@/constants';
import type { LegendArgs } from '@/constants';
import type { ColorPalette } from '@/AtlasRenderingSystem';

export function buildProductPalette(legend: LegendArgs): ColorPalette {
  return {
    scale: legend.scale,
    rawColors: COLOR_OPTIONS[legend.colorKey],
    legendRange: legend.range as [number, number],
  };
}
