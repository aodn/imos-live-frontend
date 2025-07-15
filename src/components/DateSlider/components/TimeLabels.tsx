import { memo, useMemo, useCallback } from 'react';
import { TimeLabel, TimeLabelsProps } from '../type';
import { formatDateForDisplay } from '../utils';
import { useViewportSize } from '@/hooks';

export const TimeLabels = memo(
  ({
    timeLabels,
    scales,
    trackWidth,
    timeUnit,
    minDistance = 40,
    isTimeLabelPerDay = false,
    className = 'bottom-0 text-center text-sm text-imos-white absolute',
  }: TimeLabelsProps) => {
    const { widthBreakpoint } = useViewportSize();
    const isMobileOrTablet = ['sm', 'md'].includes(widthBreakpoint || '');

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

      return visible;
    }, [timeLabels, scales, trackWidth, minDistance]);

    const visibleLabels = useMemo(
      () => (isMobileOrTablet ? getVisibleLabels().slice(0, 1) : getVisibleLabels()),
      [getVisibleLabels, isMobileOrTablet],
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
