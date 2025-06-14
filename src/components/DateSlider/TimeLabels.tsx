import { memo } from 'react';
import { TimeLabel, TimeLabelsProps } from './type';
import { formatDateForDisplay } from './dateSliderUtils';

export const TimeLabels = memo(
  ({
    timeLabels,
    scales,
    trackWidth,
    timeUnit,
    minDistance = 40,
    className = 'bottom-0 text-center text-sm text-gray-700 absolute',
  }: TimeLabelsProps) => {
    const isFirstTimeLabelHidden = timeLabels[0]?.date.getTime() < scales[0]?.date.getTime();

    const visibleLabels: TimeLabel[] = [];
    let lastVisiblePosition = -Infinity;

    timeLabels.forEach((label, index) => {
      const currentPosition = index === 0 && isFirstTimeLabelHidden ? 0 : label.position;

      if ((currentPosition - lastVisiblePosition) * trackWidth >= minDistance) {
        visibleLabels.push({ ...label, position: currentPosition });
        lastVisiblePosition = currentPosition;
      } else if (visibleLabels.length > 0) {
        visibleLabels.pop();
        visibleLabels.push({ ...label, position: currentPosition });
        lastVisiblePosition = currentPosition;
      }
    });

    return (
      <>
        {visibleLabels.map(({ date, position }, index) => (
          <span
            key={`${date.getTime()}-${index}`}
            className={className}
            style={{ left: `${position}%` }}
            aria-hidden="true"
          >
            {formatDateForDisplay(date, timeUnit, false).toUpperCase()}
          </span>
        ))}
      </>
    );
  },
);
