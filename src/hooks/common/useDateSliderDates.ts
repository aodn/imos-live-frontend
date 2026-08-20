import { DATE_RANGE } from '@/constants';
import { useMapUIStore } from '@/store';
import { toUTCDate, addTime, toISODateString } from '@/utils';

// DATE_RANGE never changes at runtime, so its exclusive end (DateSlider's `max` —
// one day past the last selectable date) only needs computing once. This is the
// one spot that genuinely needs Date arithmetic (month/year rollover); everything
// else below is plain "YYYY-MM-DD" string comparison, since zero-padded ISO date
// strings sort lexicographically the same as chronologically.
const EXCLUSIVE_END_DATE = toISODateString(addTime(toUTCDate(DATE_RANGE.end), 1, 'day'));

// Returns naive (timezone-free) date strings — DateSlider's convention.
export const useDateSliderDates = () => {
  const storeDate = useMapUIStore(s => s.date);

  const outOfRange = storeDate < DATE_RANGE.start || storeDate >= EXCLUSIVE_END_DATE;

  return {
    date: outOfRange ? DATE_RANGE.end : storeDate,
    startDate: DATE_RANGE.start,
    endDate: EXCLUSIVE_END_DATE,
  };
};
