import { memo, useCallback, useMemo } from 'react';
import type { ScalesUnitLabelsProps, TimeLabel } from '../type';
import { cn, formatDate } from '../utils';

export const ScalesUnitLabels = memo(function ScalesUnitLabels({
  scales,
  trackWidth,
  minDistance = 40,
  withEndLabel = true,
  classNames,
  dateFormat,
  locale,
  timeUnit,
}: ScalesUnitLabelsProps) {
  const getVisibleScaleLabels = useCallback((): TimeLabel[] => {
    if (!scales.length || !scales.length) return [];
    const visible: TimeLabel[] = [];
    const firstHidden = scales[0].date.getTime() < scales[0].date.getTime();

    let lastPos = -Infinity;

    for (let i = 0; i < scales.length; i++) {
      const label = scales[i];
      const pos = i === 0 && firstHidden ? 0 : label.position;

      if ((pos - lastPos) * trackWidth >= minDistance) {
        visible.push({ ...label, position: pos });
        lastPos = pos;
      } else if (visible.length > 0) {
        visible[visible.length - 1] = { ...label, position: pos };
        lastPos = pos;
      }
    }

    return withEndLabel ? visible : visible.slice(0, -1);
  }, [scales, trackWidth, minDistance, withEndLabel]);

  const visibleScaleLabels = useMemo(() => getVisibleScaleLabels(), [getVisibleScaleLabels]);

  return (
    <>
      {visibleScaleLabels.map(({ date, position }, index) => (
        <span
          key={`${date.getTime()}-${index}`}
          className={cn(
            'bottom-0 whitespace-nowrap text-center text-xs font-medium text-slate-700 shadow-sm absolute',
            classNames?.scaleLabel,
          )}
          style={{ left: `${position}%` }}
          aria-hidden="true"
        >
          {formatDate({
            date,
            format: dateFormat,
            locale,
            variant: 'scale',
            timeUnit,
          }).toUpperCase()}
        </span>
      ))}
    </>
  );
});

ScalesUnitLabels.displayName = 'TimeUnitLabels';
