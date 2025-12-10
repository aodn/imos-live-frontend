import { useMemo } from 'react';
import type { TimeDisplayProps } from '../type';
import { getDateFromPercent, formatForDisplay, addTime } from '../utils';

export const TimeDisplay = ({
  position,
  startDate,
  endDate,
  granularity,
  setDateTime,
  renderTimeDisplay,
}: TimeDisplayProps) => {
  const dateLabel = useMemo(() => {
    const date = getDateFromPercent(position, startDate, endDate);
    return formatForDisplay(date, granularity, 'en-AU', true);
  }, [position, startDate, endDate, granularity]);

  const handleDateUpdate = (direction: 'forward' | 'backward') => {
    const currentDate = getDateFromPercent(position, startDate, endDate);
    const amount = direction === 'forward' ? 1 : -1;

    const unit = granularity;
    const newDate = addTime(currentDate, amount, unit);
    setDateTime(newDate, 'point');
  };
  return renderTimeDisplay({
    dateLabel,
    toNextDate: () => handleDateUpdate('forward'),
    toPrevDate: () => handleDateUpdate('backward'),
  });
};
