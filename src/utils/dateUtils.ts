import { FixedLengthArray } from '@/types';

export function getLastDates<const T extends number>(length: T) {
  return (format: string = 'yyyy-mm-dd'): FixedLengthArray<string, T> => {
    const dates: string[] = [];
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate());

    for (let i = length; i >= 0; i--) {
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

export const getLast30Dates = getLastDates(30);

/**
 * Convert dateString to yy-mm-dd type, beacuse current GSLA data for ocean current particles are named in yy-mm-dd format, which should be changed
 * in the future.
 * @param dateString
 * @returns
 */
export function toDateFormatString(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: "${dateString}"`);
  }

  const yy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return `${yy}-${mm}-${dd}`;
}

export function dateToUTC(dateString: string): Date {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: "${dateString}"`);
  }
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ),
  );
}

/**
 * Converts a UTC date string to local timezone
 * @param input
 * @returns Date object in local timezone, which is 00:00:00 (midnight) in local time on the same year/month/day as in UTC.
 */
export function toLocalDate(input: number | string | Date): Date {
  const utcDate = new Date(input);
  if (isNaN(utcDate.getTime())) {
    throw new Error(`Invalid UTC date: ${input}`);
  }

  return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
}

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
