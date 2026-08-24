import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(utc);
dayjs.extend(customParseFormat);

/**
 * Format an already-resolved instant (`Date`, or a string with an explicit
 * offset/`Z`) as the UTC datetime string the site APIs' `datetime` query
 * param expects. A bare naive `yyyy-mm-dd`/`yyyy-mm-ddThh:mm:ss` string is
 * parsed as browser-local time before conversion — pass one only if that's
 * genuinely what you mean; callers here always pass a `Date` whose instant
 * was already resolved against the app's `timezone` setting.
 */
export function instantToUTCString(date: string | Date, format = 'YYYY-MM-DDTHH:mm:ss[Z]'): string {
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

// Truncate a UTC instant to its `yyyy-mm-dd` UTC calendar date.
export function utcToDateOnly(input: number | string | Date, format = 'YYYY-MM-DD'): string {
  const date = dayjs.utc(input);

  if (!date.isValid()) {
    throw new Error(`Invalid UTC date: ${input}`);
  }

  return date.format(format);
}

// Format a UTC instant in the given timezone frame — 'UTC' keeps it as UTC,
// 'LOCAL' converts to the browser's local time. Defaults to a bare calendar
// day; pass a time-inclusive format for datetime display.
export function utcToTimezoneString(
  input: number | string | Date,
  timezone: 'UTC' | 'LOCAL',
  format = 'YYYY-MM-DD',
): string {
  return timezone === 'UTC' ? utcToDateOnly(input, format) : utcToLocalDateTime(input, format);
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
function toLocalStartOfDay(date: string | Date) {
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
export function isWithinDaysBefore(a: string | Date, b: string | Date, days = 30): boolean {
  const diff = toLocalStartOfDay(b).diff(toLocalStartOfDay(a), 'day');
  return diff >= 0 && diff <= days;
}

/** True when `date` is strictly a naive `yyyy-mm-dd` calendar-day string (no time, no offset/Z). */
export function isNaiveDateString(date: string): boolean {
  return dayjs(date, 'YYYY-MM-DD', true).isValid();
}

/**
 * Parse a naive (timezone-free) date string into a UTC `Date`, imposing a UTC
 * interpretation on it. A bare `yyyy-mm-dd` is treated as midnight UTC.
 * Throws on a `Z` suffix or a real timezone offset — unlike `utcToDateOnly`,
 * this expects input that is NOT already a resolved UTC instant. This app's
 * dates (and DateSlider's) are timezone-free by design, so an offset almost
 * always means a real UTC instant was passed by mistake instead of a naive
 * wall-clock value. Mirrors the helper in the self-contained DateSlider
 * package so the host app doesn't depend on that package's internals.
 */
export function naiveToUTCDate(dateString: string): Date {
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(dateString)) {
    throw new Error(
      `naiveToUTCDate: "${dateString}" includes a timezone offset or "Z". Dates here are ` +
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
export function addUTCTime(
  date: Date,
  amount: number,
  unit: 'day' | 'month' | 'year' | 'hour' | 'minute',
): Date {
  return dayjs.utc(date).add(amount, unit).toDate();
}

/**
 * Extract the `yyyy-mm-dd` portion from a naive datetime string, e.g. DateSlider's
 * `"YYYY-MM-DDTHH:mm:ss"` onChange output. This app only tracks day granularity.
 */
export function naiveToDateOnly(naiveDateTime: string): string {
  return naiveDateTime.slice(0, 10);
}
