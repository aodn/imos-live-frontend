import { useMapUIStore } from '@/store';
import { getLast31Dates } from '@/utils';
import { useMemo } from 'react';

export const useDateSliderDates = () => {
  const date = useMapUIStore(s => s.date);

  const dateRange = useMemo(() => getLast31Dates('yyyy-mm-dd'), []);
  const startDate = useMemo(() => new Date(dateRange[0]), [dateRange]);
  const endDate = useMemo(() => {
    const last = new Date(dateRange.at(-1)!);
    last.setDate(last.getDate() + 1);
    return last;
  }, [dateRange]);
  return { date, startDate, endDate };
};
