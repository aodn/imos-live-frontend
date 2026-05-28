import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import type { FixedLengthArray } from '@/types';

dayjs.extend(utc);

/** Convert a local date string (yyyy-mm-dd) or Date to the nanosecond UTC format expected by the wave buoy API
 *
 * In frontend, we display dates in local time to users, but the wave buoy API expects dates in UTC with nanosecond precision.
 * We need to convert local dates to UTC and add the time component to ensure we are querying the correct date range.
 */
export function localToUTC(
  date: string | Date,
  format = 'YYYY-MM-DDTHH:mm:ss.000000000[Z]',
): string {
  return dayjs(date).utc().format(format);
}

// Convert UTC to local date time
// dayjs(date).utc() vs dayjs.utc(date)
// dayjs(date).utc() convernt localdatetime to utc.
// dayjs.utc(date) convert utc to utc, becasue it expected date is utc.
export function utcToLocalDateTime(
  input: number | string | Date,
  format = 'YYYY-MM-DD HH:mm:ss',
): string {
  const date = dayjs.utc(input);

  if (!date.isValid()) {
    throw new Error(`Invalid UTC date: ${input}`);
  }

  return date.local().format(format);
}

export function getLastDates<const T extends number>(length: T) {
  return (format: string = 'yyyy-mm-dd'): FixedLengthArray<string, T> => {
    const dates: string[] = [];
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate());

    for (let i = length - 1; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - i);

      const yyyy = date.getFullYear();
      const yy = String(yyyy).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');

      const formattedDate = format
        .replace(/yyyy/g, String(yyyy))
        .replace(/yy/g, yy)
        .replace(/mm/g, mm)
        .replace(/dd/g, dd);

      dates.push(formattedDate);
    }

    return dates as FixedLengthArray<string, T>;
  };
}
/**
 * Get the last 7 dates in the format "YYYY-MM-DD".
 * The dates are in descending order, starting from 6 days ago.
 * For example, if today is 2023-10-07, the output will be:
 * ["2023-10-01", "2023-10-02", "2023-10-03", "2023-10-04", "2023-10-05", "2023-10-06", "2023-10-07"]
 * @returns Last 7 dates in the format "YY-MM-DD".
 * By passing format like 'yyyy-mm-dd', 'yy-mm-dd', 'dd/mm/yyyy', it will generate dates liek:
 * getLast7Dates('yy-mm-dd');
    → ['24-05-25', ..., '24-05-31']

    getLast7Dates('yyyy/mm/dd');
    → ['2024/05/25', ..., '2024/05/31']

    getLast7Dates('dd.mm.yyyy');
    → ['25.05.2024', ..., '31.05.2024']
 */
export const getLast7Dates = getLastDates(7);
export const getLast10Dates = getLastDates(10);

export const getLast31Dates = getLastDates(31);
export const getLast60Dates = getLastDates(60);

export function getDate3DaysAgo() {
  const today = new Date();
  const resultDate = new Date(today);
  resultDate.setDate(today.getDate() - 3);
  return resultDate;
}

export function isSameDay(date1: Date, date2: Date) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/** Convert compact date string (yyyymmdd) to ISO format (yyyy-mm-dd) */
export function toISOFromCompact(date: string): string {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

/** Convert ISO format (yyyy-mm-dd) to compact date string (yyyymmdd)*/
export function toCompactDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return;
  }
  return date.replace(/-/g, '');
}

/** Extract the latest fulfilled date from Promise.allSettled results */
export function getLatestFulfilledDate(results: PromiseSettledResult<string | null>[]) {
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
    .map(r => r.value)
    .sort()
    .at(-1);
}

export const today = () => dayjs().format('YYYYMMDD');
const FORMATS = [
  'YYYY-MM-DD',
  'YYYY/MM/DD',
  'DD-MM-YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ss',
];

// dayjs(input) always convert input to local datetime, no matter what input is, even 'Z' existing in input will also be ignored.
function normalizeToLocalStarting(date: string | Date) {
  if (!date) {
    return dayjs().startOf('day');
  }
  if (date instanceof Date) {
    return dayjs(date).startOf('day');
  }
  return dayjs(date, FORMATS).startOf('day');
}

/**
 * Checks if a is more than N days before b (default 30)
 */
export function isBeforeDays(a: string | Date, b: string | Date, days = 30): boolean {
  const diff = normalizeToLocalStarting(b).diff(normalizeToLocalStarting(a), 'day');
  return diff >= 0 && diff <= days;
}
