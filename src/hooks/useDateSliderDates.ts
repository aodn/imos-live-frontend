import { DATE_RANGE } from '@/constants';
import { useMapUIStore } from '@/store';
import { toUTCDate, addTime, minusOneUTCDay } from '@/utils';
import { useMemo } from 'react';

export const useDateSliderDates = () => {
  let date = toUTCDate(useMapUIStore(s => s.date));

  const dateRange = DATE_RANGE;

  const startDate = useMemo(() => toUTCDate(dateRange[0]), [dateRange]);

  const endDate = useMemo(() => {
    const lastDateString = toUTCDate(dateRange.at(-1)!);
    return addTime(lastDateString, 1, 'day'); //add one day to make endDate exclusive, as we still want to select the last date from dateRange.
  }, [dateRange]);

  if (date < startDate || date >= endDate) {
    date = minusOneUTCDay(endDate);
  }

  return {
    date: date,
    startDate,
    endDate,
  };
};
