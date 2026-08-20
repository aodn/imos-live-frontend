import { DATE_RANGE } from '@/constants';
import { useMapUIStore } from '@/store';
import { toUTCDate, addTime, minusOneUTCDay } from '@/utils';
import { useMemo } from 'react';

export const useDateSliderDates = () => {
  let date = toUTCDate(useMapUIStore(s => s.date));

  const startDate = useMemo(() => toUTCDate(DATE_RANGE.start), []);

  const endDate = useMemo(() => {
    //add one day to make endDate exclusive, as we still want to select the last date from DATE_RANGE.
    return addTime(toUTCDate(DATE_RANGE.end), 1, 'day');
  }, []);

  if (date < startDate || date >= endDate) {
    date = minusOneUTCDay(endDate);
  }

  return {
    date: date,
    startDate,
    endDate,
  };
};
