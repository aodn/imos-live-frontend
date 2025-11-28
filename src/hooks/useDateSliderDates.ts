import { useMapUIStore } from '@/store';
import { getLast31Dates } from '@/utils';
import { toUTCDate, addTime } from '@/components/DateSlider/utils';
import { useMemo } from 'react';

export const useDateSliderDates = () => {
  const date = useMapUIStore(s => s.date);

  const dateRange = useMemo(() => getLast31Dates('yyyy-mm-dd'), []);

  // Convert start date string to UTC Date
  const startDate = useMemo(() => toUTCDate(dateRange[0]), [dateRange]);

  // Convert end date string to UTC Date and add 1 day
  const endDate = useMemo(() => {
    const lastDateString = dateRange.at(-1)!;
    const lastDate = toUTCDate(lastDateString);
    return addTime(lastDate, 1, 'day');
  }, [dateRange]);

  return { date: toUTCDate(date), startDate, endDate };
};
