import { convertLogColorScaleToRamp, convertLinearColorScaleToRamp } from '@/components';
import { COLOR_OPTIONS } from '@/config';
import type { LegendArgs } from '@/constants';
import type { ColorPalette } from '@/layers';

export function buildProductPalette(legend: LegendArgs): ColorPalette {
  const rawColors = COLOR_OPTIONS[legend.colorKey];
  const colors =
    legend.scale === 'log'
      ? convertLogColorScaleToRamp({
          minMaxRatio: legend.range[0] / legend.range[1],
          colors: rawColors,
        })
      : convertLinearColorScaleToRamp({ colors: rawColors });
  return { scale: legend.scale, rawColors, colors, legendRange: legend.range as [number, number] };
}
