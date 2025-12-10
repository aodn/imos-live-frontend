import { memo, useCallback, useMemo } from 'react';
import type { TimeUnitLabelsProps, TimeLabel } from '../type';
import { formatForDisplay } from '../utils';

export const TimeUnitLabels = memo(
  ({
    timeLabels,
    scales,
    trackWidth,
    minDistance = 40,
    withEndLabel = true,
    classNames,
  }: TimeUnitLabelsProps) => {
    const getVisibleLabels = useCallback((): TimeLabel[] => {
      if (!timeLabels.length || !scales.length) return [];
      const visible: TimeLabel[] = [];
      const firstHidden = timeLabels[0].date.getTime() < scales[0].date.getTime();

      let lastPos = -Infinity;

      for (let i = 0; i < timeLabels.length; i++) {
        const label = timeLabels[i];
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
    }, [timeLabels, scales, trackWidth, minDistance, withEndLabel]);

    const visibleLabels = useMemo(() => getVisibleLabels(), [getVisibleLabels]);

    return (
      <>
        {visibleLabels.map(({ date, position }, index) => (
          <span
            key={`${date.getTime()}-${index}`}
            className={
              classNames?.scaleLabel ||
              'bottom-0 whitespace-nowrap text-center text-xs font-medium text-slate-700 shadow-sm absolute'
            }
            style={{ left: `${position}%` }}
            aria-hidden="true"
          >
            {formatForDisplay(date, 'day', 'en-AU', false).toUpperCase()}
          </span>
        ))}
      </>
    );
  },
);

TimeUnitLabels.displayName = 'TimeUnitLabels';
