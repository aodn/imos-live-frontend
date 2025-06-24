import { FixedLengthArray } from '@/types';

/**
 * Get the last 7 dates in the format "YYYY-MM-DD" ending 3 days ago.
 * The dates are in descending order, starting from 6 days ago to 3 days ago.
 * For example, if today is 2023-10-10, the output will be:
 * ["2023-10-01", "2023-10-02", "2023-10-03", "2023-10-04", "2023-10-05", "2023-10-06", "2023-10-07"]
 * @returns Last 7 dates in the format "YY-MM-DD" ending 3 days ago.
 * By passing format like 'yyyy-mm-dd', 'yy-mm-dd', 'dd/mm/yyyy', it will generate dates liek:
 * getLast7DatesEnding3DaysAgo('yy-mm-dd');
    → ['24-05-25', ..., '24-05-31']

    getLast7DatesEnding3DaysAgo('yyyy/mm/dd');
    → ['2024/05/25', ..., '2024/05/31']

    getLast7DatesEnding3DaysAgo('dd.mm.yyyy');
    → ['25.05.2024', ..., '31.05.2024']
 */
export function getLast7DatesEnding3DaysAgo(
  format: string = 'yyyy-mm-dd',
): FixedLengthArray<string, 7> {
  const dates: string[] = [];
  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() - 3);

  for (let i = 6; i >= 0; i--) {
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

  return dates as FixedLengthArray<string, 7>;
}

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
 * @param dateString
 * @returns Date object in local timezone
 */
export function convertUTCToLocalDateTime(input: string | Date): Date {
  const utcDate = new Date(input);
  if (isNaN(utcDate.getTime())) {
    throw new Error(`Invalid UTC date: ${input}`);
  }

  return new Date(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), utcDate.getUTCDate());
}
