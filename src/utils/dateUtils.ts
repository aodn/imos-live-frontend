import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(utc);
dayjs.extend(customParseFormat);

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

// Convert a UTC instant to a local-time string.
// Note the distinction: `dayjs(date).utc()` converts a local datetime to UTC,
// whereas `dayjs.utc(date)` parses the input as already being UTC.
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

/**
 * Boundary dates of a "last N days" range, ending today.
 */
export function getLastDateRange(
  length: number,
  format: string = 'yyyy-mm-dd',
): { start: string; end: string } {
  const dayjsFormat = format.toUpperCase();
  const base = dayjs().startOf('day');
  return {
    start: base.subtract(length - 1, 'day').format(dayjsFormat),
    end: base.format(dayjsFormat),
  };
}

export function today() {
  return dayjs().format('YYYYMMDD');
}

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
 * Returns true when `a` falls within `days` days *before* `b`, inclusive on
 * both ends — i.e. `0 ≤ (b − a) ≤ days`. Returns false when `a` is after `b`,
 * or more than `days` days before it. Default window is 30 days.
 */
export function isBeforeDays(a: string | Date, b: string | Date, days = 30): boolean {
  const diff = normalizeToLocalStarting(b).diff(normalizeToLocalStarting(a), 'day');
  return diff >= 0 && diff <= days;
}

/**
 * Parse a naive (timezone-free) date string into a UTC `Date`. A bare
 * `yyyy-mm-dd` is treated as midnight UTC. Throws on a `Z` suffix or a real
 * timezone offset — this app's dates (and DateSlider's) are timezone-free by
 * design, so an offset almost always means a real UTC instant was passed by
 * mistake instead of a naive wall-clock value. Mirrors the helper in the
 * self-contained DateSlider package so the host app doesn't depend on that
 * package's internals.
 */
export function toUTCDate(dateString: string): Date {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateString)) {
    throw new Error(
      `toUTCDate: "${dateString}" includes a timezone offset or "Z". Dates here are ` +
        `timezone-free — pass a naive "yyyy-mm-dd" or "yyyy-mm-ddThh:mm:ss" string.`,
    );
  }

  // A bare `yyyy-mm-dd` is interpreted as midnight UTC; strings with a time
  // component are parsed as-is.
  const date = dayjs.utc(dateString);

  if (!date.isValid()) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date.toDate();
}

/** Add time units to a UTC date, operating purely on UTC components. */
export function addTime(
  date: Date,
  amount: number,
  unit: 'day' | 'month' | 'year' | 'hour' | 'minute',
): Date {
  return dayjs.utc(date).add(amount, unit).toDate();
}

/** Format a `Date` as a `yyyy-mm-dd` string using its UTC components. */
export function toISODateString(date: Date): string {
  return dayjs.utc(date).format('YYYY-MM-DD');
}

/**
 * Extract the `yyyy-mm-dd` portion from a naive datetime string, e.g. DateSlider's
 * `"YYYY-MM-DDTHH:mm:ss"` onChange output. This app only tracks day granularity.
 */
export function toDateOnly(naiveDateTime: string): string {
  return naiveDateTime.slice(0, 10);
}
