import { MHW_CATEGORY_LEGEND_COLORS, HW_CATEGORY_LEGEND_LABELS } from '@/constants';
import { cn } from '@/utils';
import { useMemo } from 'react';

type CategoryColorScaleBarProps = {
  height?: number;
  className?: string;
  colors?: string[];
  labels?: string[];
  label?: string;
};

export function CategoryColorScaleBar({
  height = 10,
  className,
  colors = MHW_CATEGORY_LEGEND_COLORS,
  labels = HW_CATEGORY_LEGEND_LABELS,
  label,
}: CategoryColorScaleBarProps) {
  const segments = useMemo(
    () =>
      colors.map((value, i) => ({
        value,
        color: colors[i] ?? '#ccc',
        displayLabel: labels?.[i] ?? String(value),
      })),
    [colors, labels],
  );

  // const dividers = useMemo(
  //   () =>
  //     segments.slice(1).map((_, i) => ({
  //       key: i + 1,
  //       position: ((i + 1) / segments.length) * 100,
  //     })),
  //   [segments],
  // );

  return (
    <div className={cn(className)}>
      <div className="w-full">
        <div className="w-full flex" style={{ height: `${height}px` }}>
          {segments.map(({ value, color }) => (
            <div key={`segment-${value}`} style={{ backgroundColor: color, flex: 1 }} />
          ))}
        </div>

        {/* <div className="relative h-1">
          {dividers.map(({ key, position }) => (
            <div
              key={`divider-${key}`}
              className="absolute h-full bg-black w-0.5"
              style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
            />
          ))}
        </div> */}

        <div className="flex">
          {segments.map(({ value, displayLabel }) => (
            <div key={`label-${value}`} className="flex-1 flex justify-center">
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
