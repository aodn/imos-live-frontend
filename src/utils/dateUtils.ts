import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { FixedLengthArray } from '@/types';

dayjs.extend(utc);

/** Format a date string (yyyy-mm-dd) or Date to the nanosecond UTC format expected by the wave buoy API */
export function toWaveBuoyApiDate(date: string | Date): string {
  return dayjs.utc(date).format('YYYY-MM-DDTHH:mm:ss.000000000[Z]');
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

/**
 * Converts a UTC date string to local time string
 * @param input
 * @param locales
 * @param options
 * @returns LocaleDateString
 */
export function toLocalDateTime(
  input: number | string | Date,
  locales?: Intl.LocalesArgument,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = new Date(input);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid UTC date: ${input}`);
  }
  return date.toLocaleString(locales, options);
}

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

/**
 * Convert UTC date to ISO date string (YYYY-MM-DD)
 *
 * Useful for API calls and storage that expect date strings.
 * Uses UTC date components to avoid timezone issues.
 *
 * @param date - UTC date
 * @returns ISO date string
 *
 * @example
 * toISODateString(new Date("2024-01-15T14:30:00Z"))
 * // → "2024-01-15"
 */
export function toISODateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/** Convert compact date string (yyyymmdd) to ISO format (yyyy-mm-dd) */
export function toISOFromCompact(date: string): string {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}

/** Extract the latest fulfilled date from Promise.allSettled results */
export function getLatestFulfilledDate(results: PromiseSettledResult<string | null>[]) {
  return results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === 'fulfilled' && !!r.value)
    .map(r => r.value)
    .sort()
    .at(-1);
}

/** Convert ISO format (yyyy-mm-dd) to compact date string (yyyymmdd)*/
export function toCompactDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return;
  }
  return date.replace(/-/g, '');
}
