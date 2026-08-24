import { useMemo } from 'react';
import { useMapUIStore } from '@/store';
import { naiveToUTCDate, addUTCTime, utcToDateOnly, utcToTimezoneString } from '@/utils';
import { DATE_RANGE } from '@/constants/mapInitialState';

// Returns naive (timezone-free) date strings — DateSlider's convention.
export const useDateSliderDates = () => {
  const storeDate = useMapUIStore(s => s.date);
  const timezone = useMapUIStore(s => s.timezone);

  const { today, endDate } = useMemo(() => {
    const todayDate = utcToTimezoneString(new Date(), timezone);
    return {
      today: todayDate,
      endDate: utcToDateOnly(addUTCTime(naiveToUTCDate(todayDate), 1, 'day')),
    };
  }, [timezone]);

  const outOfRange = storeDate < DATE_RANGE.start || storeDate >= endDate;

  return {
    date: outOfRange ? today : storeDate,
    startDate: DATE_RANGE.start,
    endDate,
  };
};
