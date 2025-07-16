import { memo, useMemo, useCallback } from 'react';
import { TimeLabel, TimeLabelsProps } from '../type';
import { formatDateForDisplay } from '../utils';
import { useViewportSize } from '@/hooks';
import { getFirstAndLast } from '@/utils';

export const TimeLabels = memo(
  ({
    timeLabels,
    scales,
    trackWidth,
    timeUnit,
    minDistance = 40,
    isTimeLabelPerDay = false,
    withEndLabel = true,
    className = 'bottom-0 whitespace-nowrap text-center text-xs text-imos-white absolute',
  }: TimeLabelsProps) => {
    const { widthBreakpoint } = useViewportSize();
    const isSmallScreen = ['sm', 'md'].includes(widthBreakpoint || '');

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

    const visibleLabels = useMemo(
      () => (isSmallScreen ? getFirstAndLast(getVisibleLabels()) : getVisibleLabels()),
      [getVisibleLabels, isSmallScreen],
    );

    return (
      <>
        {visibleLabels.map(({ date, position }, index) => (
          <span
            key={`${date.getTime()}-${index}`}
            className={className}
            style={{ left: `${position}%` }}
            aria-hidden="true"
          >
            {formatDateForDisplay(date, timeUnit, isTimeLabelPerDay).toUpperCase()}
          </span>
        ))}
      </>
    );
  },
);

TimeLabels.displayName = 'TimeLabels';
