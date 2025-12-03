import type { RefObject } from 'react';

import { clampPercent } from '@/utils';
import {
  TimeUnit,
  NumOfScales,
  ScaleUnitConfig,
  Scale,
  ScaleType,
  TimeLabel,
  ViewMode,
  SelectionResult,
} from '../type';

/**
 * Add a certain amount of scale units to a date to get a new date.
 *
 * When unit is 'day', adds days. When unit is 'month', adds months.
 * When unit is 'year', adds years.
 *
 * @param date - The base date to add to
 * @param amount - The number of units to add (can be negative)
 * @param unit - The time unit to add
 * @returns A new Date object with the added time
 *
 * @example
 * generateNewDateByAddingScaleUnit(new Date('2024-01-15'), 5, 'day')
 * // Returns: Date('2024-01-20')
 *
 * @example
 * generateNewDateByAddingScaleUnit(new Date('2024-01-15'), 2, 'month')
 * // Returns: Date('2024-03-15')
 */
/**
 * Add scale units to a UTC date
 *
 * Uses UTC methods to ensure consistent behavior across timezones
 *
 * @param date - The base UTC date
 * @param amount - Number of units to add (can be negative)
 * @param unit - The time unit to add
 * @returns New UTC Date with the time added
 */
export const generateNewDateByAddingScaleUnit = (
  date: Date,
  amount: number,
  unit: TimeUnit,
): Date => {
  const newDate = new Date(date);
  switch (unit) {
    case 'day':
      newDate.setUTCDate(newDate.getUTCDate() + amount);
      break;
    case 'month':
      newDate.setUTCMonth(newDate.getUTCMonth() + amount);
      break;
    case 'year':
      newDate.setUTCFullYear(newDate.getUTCFullYear() + amount);
      break;
  }
  return newDate;
};

/**
 * Calculate total number of scales for different combination of start date, end date and unit as 'day'|'month'|'year'.
 *
 * @param start - Start date
 * @param end - End date
 * @param unit - Time unit ('day', 'month', or 'year')
 * @returns Total number of scale units
 *
 * @example
 * // For days: if there are 49 hours between start and end, returns Math.ceil(49/24) = 3
 * getTotalScales(new Date('2024-01-01'), new Date('2024-01-03'), 'day') // 2
 *
 * @example
 * // For months: from Jan to Mar (inclusive) returns 3
 * getTotalScales(new Date('2024-01-01'), new Date('2024-03-31'), 'month') // 3
 *
 * @example
 * // For years: from 2024 to 2026 (inclusive) returns 3
 * getTotalScales(new Date('2024-01-01'), new Date('2026-12-31'), 'year') // 3
 */
export const getTotalScales = (start: Date, end: Date, unit: TimeUnit): number => {
  const msDiff = end.getTime() - start.getTime();

  switch (unit) {
    case 'day':
      return Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    case 'month': {
      // Calculate the difference in months using UTC methods
      // Note: Adding 1 to include both start and end months
      const yearDiff = end.getUTCFullYear() - start.getUTCFullYear();
      const monthDiff = end.getUTCMonth() - start.getUTCMonth();
      return yearDiff * 12 + monthDiff + 1;
    }
    case 'year':
      // Calculate the difference in years (inclusive) using UTC methods
      return end.getUTCFullYear() - start.getUTCFullYear() + 1;
  }
};

/**
 * Get a representative date for labeling based on the time unit.
 *
 * This function returns the most appropriate date to use for labels
 * at different zoom levels:
 * - day: returns the date normalized to midnight
 * - month: returns January 1st of the year
 * - year: returns January 1st of the decade
 *
 * @param date - The date to get representative date for
 * @param unit - The time unit context
 * @returns A representative date for labeling
 */
/**
 * Get a representative UTC date for labeling based on the time unit
 *
 * Uses UTC methods to ensure consistent behavior across timezones
 *
 * @param date - The UTC date to get representative date for
 * @param unit - The time unit context
 * @returns A representative UTC date for labeling
 */
export const getRepresentativeDate = (date: Date, unit: TimeUnit): Date => {
  switch (unit) {
    case 'day':
      return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    case 'month':
      return new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    case 'year':
      return new Date(Date.UTC(Math.floor(date.getUTCFullYear() / 10) * 10, 0, 1));
  }
};

/**
 * Calculate the total width of the slider track in pixels.
 *
 * The track width is calculated based on:
 * - Total number of scale units × gap between units
 * - Plus the widths of all scale marks (short, medium, long)
 *
 * @param total - Total number of scale units
 * @param scales - Count of each scale type
 * @param scaleUnitConfig - Configuration for scale appearance
 * @returns Total track width in pixels
 */
export const generateTrackWidth = (
  total: number,
  scales: NumOfScales,
  scaleUnitConfig: Omit<ScaleUnitConfig, 'gap'> & { gap: number },
): number => {
  return (
    total * scaleUnitConfig.gap +
    scales.long * scaleUnitConfig.width.long +
    scales.medium * scaleUnitConfig.width.medium +
    scales.short * scaleUnitConfig.width.short
  );
};

/**
 * Generate scale marks with position and type information.
 *
 * Creates an array of scale objects representing tick marks on the slider.
 * Scale types (short/medium/long) are determined by date significance:
 * - Day mode: long=1st of month, medium=Monday, short=other days
 * - Month mode: long=January, medium=quarter start, short=other months
 * - Year mode: long=decade start, medium=5-year mark, short=other years
 *
 * @param start - Start date of the range
 * @param end - End date of the range
 * @param unit - Time unit for scales
 * @param totalUnits - Total number of scale units
 * @returns Object containing scales array and count by type
 */
export const generateScalesWithInfo = (
  start: Date,
  end: Date,
  unit: TimeUnit,
  totalUnits: number,
): { scales: Scale[]; numberOfScales: NumOfScales } => {
  const scales: Scale[] = [];
  const scaleCounts = { short: 0, medium: 0, long: 0 };

  const startTime = start.getTime();
  const endTime = end.getTime();
  const totalTimeSpan = endTime - startTime;

  for (let i = 0; i < totalUnits; i++) {
    //i <= totalUnits to i < totalUnits
    const current = generateNewDateByAddingScaleUnit(start, i, unit);
    if (current > end) break;

    // Calculate position based on actual time elapsed
    const currentTime = current.getTime();
    const position = totalTimeSpan === 0 ? 0 : ((currentTime - startTime) / totalTimeSpan) * 100;

    let type: ScaleType = 'short';
    switch (unit) {
      case 'day':
        type = current.getUTCDate() === 1 ? 'long' : current.getUTCDay() === 1 ? 'medium' : 'short';
        break;
      case 'month':
        type =
          current.getUTCMonth() === 0
            ? 'long'
            : current.getUTCMonth() % 3 === 0
              ? 'medium'
              : 'short';
        break;
      case 'year':
        type =
          current.getUTCFullYear() % 10 === 0
            ? 'long'
            : current.getUTCFullYear() % 5 === 0
              ? 'medium'
              : 'short';
        break;
    }

    scaleCounts[type]++;
    scales.push({ date: current, position, type });
  }

  // Add an end scale if we don't have one exactly at the end date
  // Check both date and position to avoid duplicates
  const lastScale = scales[scales.length - 1];
  if (
    scales.length > 0 &&
    lastScale &&
    (lastScale.date.getTime() !== endTime || lastScale.position !== 100)
  ) {
    const type: ScaleType = 'short';
    scaleCounts[type]++;
    scales.push({ date: end, position: 100, type });
  }
  return { scales, numberOfScales: scaleCounts };
};

export const generateTimeLabelsWithPositions = (
  start: Date,
  end: Date,
  unit: TimeUnit,
): TimeLabel[] => {
  const labels: TimeLabel[] = [];
  const current = new Date(start);

  const startTime = start.getTime();
  const endTime = end.getTime();
  const totalTimeSpan = endTime - startTime;

  while (current <= end) {
    let labelDate: Date | undefined;
    switch (unit) {
      case 'day':
        labelDate = new Date(
          Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()),
        );
        current.setUTCDate(current.getUTCDate() + 1);
        break;
      case 'month':
        labelDate = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
        current.setUTCFullYear(current.getUTCFullYear() + 1);
        break;
      case 'year': {
        const decade = Math.floor(current.getUTCFullYear() / 10) * 10;
        labelDate = new Date(Date.UTC(decade, 0, 1));
        current.setUTCFullYear(decade + 10);
        break;
      }
    }

    if (
      labelDate &&
      labelDate.getTime() <= end.getTime() &&
      (labels.length === 0 || labels[labels.length - 1].date.getTime() !== labelDate.getTime())
    ) {
      // Calculate position using the same method as scales
      const labelTime = labelDate.getTime();
      const percentage = totalTimeSpan === 0 ? 0 : ((labelTime - startTime) / totalTimeSpan) * 100;

      labels.push({ date: labelDate, position: percentage });
    }
  }

  // Add end label if needed
  const endLabel = getRepresentativeDate(end, unit);
  if (labels.length === 0 || labels[labels.length - 1].date.getTime() !== endLabel.getTime()) {
    const labelTime = endLabel.getTime();
    const percentage = totalTimeSpan === 0 ? 0 : ((labelTime - startTime) / totalTimeSpan) * 100;
    labels.push({ date: endLabel, position: percentage });
  }

  return labels;
};

/**
 * Convert a mouse event position to a percentage along the track.
 *
 * @param e - Mouse event
 * @param trackRef - Reference to the track element
 * @returns Percentage (0-100) of the mouse position along the track
 */
export const getPercentageFromMouseEvent = (
  e: React.MouseEvent<Element, MouseEvent> | MouseEvent,
  trackRef: React.RefObject<HTMLDivElement | null>,
): number => {
  if (!trackRef.current) return 0;
  const rect = trackRef.current.getBoundingClientRect();
  return clampPercent(((e.clientX - rect.left) / rect.width) * 100);
};

/**
 * Convert a touch event position to a percentage along the track.
 *
 * @param e - Touch event
 * @param trackRef - Reference to the track element
 * @returns Percentage (0-100) of the touch position along the track
 */
export const getPercentageFromTouchEvent = (
  e: React.TouchEvent<Element> | TouchEvent,
  trackRef: React.RefObject<HTMLDivElement | null>,
): number => {
  if (!trackRef.current || !e.touches.length) return 0;
  const rect = trackRef.current.getBoundingClientRect();
  const touch = e.touches[0] || e.changedTouches[0];
  return clampPercent(((touch.clientX - rect.left) / rect.width) * 100);
};

export const calculateLabelPosition = (
  trackRef: RefObject<HTMLDivElement | null>,
  cursorPosition: number,
) => {
  if (!trackRef.current) return;
  const trackRect = trackRef.current.getBoundingClientRect();
  const x = cursorPosition;
  const y = trackRect.top - 32;
  return { x, y };
};

/**
 * Convert a percentage position to a date within the given range.
 *
 * @param percent - Percentage (0-100) along the timeline
 * @param startDate - Start date of the range
 * @param endDate - End date of the range
 * @returns The date corresponding to the percentage
 */
export const getDateFromPercent = (percent: number, startDate: Date, endDate: Date): Date => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const targetTime = startTime + (percent / 100) * (endTime - startTime);
  return new Date(targetTime);
};

/**
 * Create a selection result object based on the view mode.
 *
 * @param rangeStart - Start percentage for range mode
 * @param startDate - Start date of the overall range
 * @param endDate - End date of the overall range
 * @param rangeEnd - End percentage for range mode
 * @param pointPosition - Point percentage for point mode
 * @param viewMode - The current view mode
 * @returns Selection result containing selected date(s) based on view mode
 */
export const createSelectionResult = (
  rangeStart: number,
  startDate: Date,
  endDate: Date,
  rangeEnd: number,
  pointPosition: number,
  viewMode: ViewMode,
): SelectionResult => {
  const startLabel = getDateFromPercent(rangeStart, startDate, endDate);
  const endLabel = getDateFromPercent(rangeEnd, startDate, endDate);
  const pointLabel = getDateFromPercent(pointPosition, startDate, endDate);

  switch (viewMode) {
    case 'range':
      return { start: startLabel, end: endLabel };
    case 'point':
      return { point: pointLabel };
    case 'combined':
      return {
        start: startLabel,
        end: endLabel,
        point: pointLabel,
      };
  }
};

/**
 * get all scales position in percentage.
 * @param start
 * @param end
 * @param unit
 * @param totalUnits
 * @returns @returns number[], for example percentage is like 36.12 instead of 0.3612
 */
export const getAllScalesPercentage = (
  start: Date,
  end: Date,
  unit: TimeUnit,
  totalUnits: number,
): number[] => {
  const scales: number[] = [];

  const startTime = start.getTime();
  const endTime = end.getTime();
  const totalTimeSpan = endTime - startTime;
  for (let i = 0; i < totalUnits; i++) {
    const current = generateNewDateByAddingScaleUnit(start, i, unit);
    if (current > end) break;

    // Calculate position based on actual time elapsed
    const currentTime = current.getTime();
    const position = totalTimeSpan === 0 ? 0 : ((currentTime - startTime) / totalTimeSpan) * 100;

    scales.push(position);
  }

  return scales;
};

/**
 * DateSlider Date Utilities
 *
 * Core Principle: UTC Everywhere, Display Locally
 *
 * - All dates are stored and manipulated as UTC timestamps
 * - Only convert to local timezone for display purposes
 * - Date-only data is represented as UTC midnight
 * - Supports future hourly/minute granularity
 */

/**
 * Date granularity supported by the slider
 */
export type DateGranularity = 'day' | 'hour' | 'minute';

/**
 * Convert an ISO date string (YYYY-MM-DD) to UTC midnight
 *
 * USE THIS: When passing date strings to DateSlider props
 *
 * @param dateString - ISO date string (YYYY-MM-DD) or ISO datetime string
 * @returns UTC Date at midnight (for date strings) or as-is (for datetime strings)
 *
 * @example
 * toUTCDate("2024-01-15") → Date("2024-01-15T00:00:00.000Z")
 * toUTCDate("2024-01-15T14:30:00Z") → Date("2024-01-15T14:30:00.000Z")
 */
export function toUTCDate(dateString: string): Date {
  // If the string doesn't include time, append midnight UTC
  const isoString = dateString.includes('T') ? dateString : dateString + 'T00:00:00.000Z';
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date string: ${dateString}`);
  }
  return date;
}

/**
 * Add time units to a UTC date
 *
 * @param date - The base date
 * @param amount - Number of units to add (can be negative)
 * @param unit - The time unit to add
 * @returns New Date with the time added
 *
 * @example
 * addTime(new Date("2024-01-15T00:00:00Z"), 1, 'day')
 * // → "2024-01-16T00:00:00Z"
 *
 * addTime(new Date("2024-01-15T14:00:00Z"), 3, 'hour')
 * // → "2024-01-15T17:00:00Z"
 *
 * addTime(new Date("2024-01-15T14:00:00Z"), -2, 'hour')
 * // → "2024-01-15T12:00:00Z"
 */
export function addTime(
  date: Date,
  amount: number,
  unit: 'day' | 'month' | 'year' | 'hour' | 'minute',
): Date {
  const result = new Date(date);

  switch (unit) {
    case 'minute':
      result.setUTCMinutes(result.getUTCMinutes() + amount);
      break;
    case 'hour':
      result.setUTCHours(result.getUTCHours() + amount);
      break;
    case 'day':
      result.setUTCDate(result.getUTCDate() + amount);
      break;
    case 'month':
      result.setUTCMonth(result.getUTCMonth() + amount);
      break;
    case 'year':
      result.setUTCFullYear(result.getUTCFullYear() + amount);
      break;
  }

  return result;
}

/**
 * Format UTC date for display
 *
 * Uses the browser's Intl API to format dates according to locale.
 * Always displays in UTC timezone to avoid confusion.
 *
 * @param date - UTC date to format
 * @param granularity - Display granularity
 * @param locale - Locale string (default: en-AU)
 * @param fullDate - For day granularity, whether to show full date or abbreviated
 * @returns Formatted date string
 *
 * @example
 * // Daily granularity - show only date
 * formatForDisplay(new Date("2024-01-15T00:00:00Z"), 'day', 'en-AU', true)
 * // → "15 Jan 2024"
 *
 * // Hourly granularity - show date and time
 * formatForDisplay(new Date("2024-01-15T14:00:00Z"), 'hour')
 * // → "15 Jan 2024, 14:00"
 */
export function formatForDisplay(
  date: Date,
  granularity: DateGranularity,
  locale: string = 'en-AU',
  fullDate: boolean = false,
): string {
  switch (granularity) {
    case 'day': {
      if (fullDate) {
        return date.toLocaleDateString(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        });
      }

      // Abbreviated format for labels
      const day = date.getUTCDate();
      const month = date.getUTCMonth();

      if (month === 0 && day === 1) {
        // New Year - show year
        return date.toLocaleDateString(locale, { year: 'numeric', timeZone: 'UTC' });
      }

      if (day === 1) {
        // First of month - show month
        return date.toLocaleDateString(locale, { month: 'short', timeZone: 'UTC' });
      }

      // Regular day - show day number
      return date.toLocaleDateString(locale, { day: 'numeric', timeZone: 'UTC' });
    }

    case 'hour':
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'UTC',
      });

    case 'minute':
      return date.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
      });
  }
}

/**
 * Calculate percentage position of a date within a range
 *
 * @param date - The date to position
 * @param startDate - Start of the range
 * @param endDate - End of the range
 * @returns Percentage (0-100) of the date's position
 *
 * @example
 * const start = new Date("2024-01-01T00:00:00Z");
 * const end = new Date("2024-01-31T00:00:00Z");
 * const mid = new Date("2024-01-16T00:00:00Z");
 * getPercentFromDate(mid, start, end) // → ~50
 */
export function getPercentFromDate(date: Date, startDate: Date, endDate: Date): number {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const targetTime = date.getTime();

  // Clamp to range
  const clampedTime = Math.max(startTime, Math.min(endTime, targetTime));

  // Calculate percentage
  const totalSpan = endTime - startTime;
  if (totalSpan === 0) return 0;

  const percent = ((clampedTime - startTime) / totalSpan) * 100;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, percent));
}

/**
 * Detect if handle is outside visible area in slider
 *
 * @param sliderContainerRef
 * @returns handleRef
 */
export const handleOutsideVisibleArea = ({
  sliderContainerRef,
  handleRef,
}: {
  sliderContainerRef: RefObject<HTMLDivElement | null>;
  handleRef: RefObject<HTMLButtonElement | null>;
}) => {
  const handleRect = handleRef.current?.getBoundingClientRect();
  const containerRect = sliderContainerRef.current?.getBoundingClientRect();

  const distanceFromRightEdge = (containerRect?.right || 0) - (handleRect?.right || 0);
  const distanceFromLeftEdge = (handleRect?.left || 0) - (containerRect?.left || 0);

  return {
    left: distanceFromLeftEdge < 0,
    right: distanceFromRightEdge < 0,
  };
};
