import { COLOR_OPTIONS } from '@/constants';
import type { LegendArgs } from '@/constants';
import type { ColorPalette } from '@/AtlasRenderingSystem';

// The renderer's `legendRange` only drives continuous ramps; in categorical
// mode the shader indexes colours off the manifest's `valueRange` and ignores
// it. Categorical legends don't define a range, so pass an inert placeholder.
const UNUSED_CATEGORY_LEGEND_RANGE: [number, number] = [0, 1];

export function getLegendRange(legend: LegendArgs): [number, number] {
  return legend.scale === 'category' ? UNUSED_CATEGORY_LEGEND_RANGE : legend.range;
}

export function buildProductPalette(legend: LegendArgs): ColorPalette {
  return {
    scale: legend.scale,
    rawColors: COLOR_OPTIONS[legend.colorKey],
    legendRange: getLegendRange(legend),
  };
}
