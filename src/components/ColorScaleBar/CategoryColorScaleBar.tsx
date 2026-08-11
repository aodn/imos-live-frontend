import { COLOR_OPTIONS } from '@/constants';
import { PRODUCT, PRODUCTLEGENDS } from '@/constants';
import { cn, rgbToHex } from '@/utils';
import { useMemo } from 'react';

type CategoryColorScaleBarProps = {
  height?: number;
  className?: string;
  colors?: [number, number, number][];
  scales?: string[];
  label?: string;
};

export function CategoryColorScaleBar({
  height = 10,
  className,
  colors = COLOR_OPTIONS[PRODUCTLEGENDS[PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY_MOSAIC].colorKey],
  scales = PRODUCTLEGENDS[PRODUCT.AUSTEMP_HEATWAVE_MCS_CATEGORY_MOSAIC].scales as string[],
  label,
}: CategoryColorScaleBarProps) {
  const segments = useMemo(
    () =>
      colors.map(([r, g, b], i) => ({
        color: rgbToHex(r, g, b),
        displayLabel: scales?.[i] ?? String(i),
      })),
    [colors, scales],
  );

  return (
    <div className={cn(className)}>
      <div className="w-full">
        <div className="w-full flex" style={{ height: `${height}px` }}>
          {segments.map(({ color }, i) => (
            <div key={`segment-${i}`} style={{ backgroundColor: color, flex: 1 }} />
          ))}
        </div>

        <div className="flex">
          {segments.map(({ displayLabel }, i) => (
            <div key={`label-${i}`} className="flex-1 flex justify-center">
              <span className="text-xs text-black font-medium">{displayLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {label && (
        <div className="mt-2 text-caption text-imos-grey text-center">
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}
