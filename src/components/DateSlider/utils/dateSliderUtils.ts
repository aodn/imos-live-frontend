import type { RefObject } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

import type {
  DateFormat,
  DateFormatFn,
  NumOfScales,
  Scale,
  ScaleType,
  ScaleTypeResolver,
  ScaleUnitConfig,
  SelectionResult,
  TimeUnit,
  ViewMode,
} from '../type';
import { clampPercent } from '../utils';

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
    case 'hour':
      newDate.setUTCHours(newDate.getUTCHours() + amount);
      break;
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
 * Calculate total number of scales for different combination of start date, end date and unit as 'hour'|'day'|'month'|'year'.
 *
 * @param start - Start date
 * @param end - End date
 * @param unit - Time unit ('hour', 'day', 'month', or 'year')
 * @returns Total number of scale units
 *
 * @example
 * // For hours: 25 hours between start and end returns 25
 * getTotalScales(new Date('2024-01-01T00:00:00Z'), new Date('2024-01-02T01:00:00Z'), 'hour') // 25
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
    case 'hour':
      return Math.ceil(msDiff / (1000 * 60 * 60));
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
 * - hour: returns the date normalized to the hour (minutes/seconds set to 0)
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
    case 'hour':
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours()),
      );
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
 * Each scale tick points to the corresponding unit.
 * Scale types (short/medium/long) are determined by the scaleTypeResolver function.
 *
 * @param start - Start date of the range
 * @param end - End date of the range
 * @param unit - Time unit for scales
 * @param totalUnits - Total number of scale units
 * @param scaleTypeResolver - Function to determine scale type for each date (defaults to defaultScaleTypeResolver)
 * @returns Object containing scales array and count by type
 */
/**
 * Generate both scales and time labels in a single pass.
 * This combines the logic of generateScalesWithInfo and generateTimeLabelsWithPositions
 * to avoid duplicate iteration and position calculations.
 *
 * @param start - Start date
 * @param end - End date
 * @param unit - Time unit
 * @param totalUnits - Total number of units
 * @param scaleTypeResolver - Optional custom resolver for scale types
 * @returns Object containing scales, timeLabels, and numberOfScales
 */
export const generateScales = (
  start: Date,
  end: Date,
  unit: TimeUnit,
  totalUnits: number,
  scaleTypeResolver?: ScaleTypeResolver,
): { scales: Scale[]; numberOfScales: NumOfScales } => {
  const scales: Scale[] = [];
  const scaleCounts = { short: 0, medium: 0, long: 0 };

  const startTime = start.getTime();
  const endTime = end.getTime();
  const totalTimeSpan = endTime - startTime;

  const resolverWithDefaultFallback = (...args: Parameters<ScaleTypeResolver>) => {
    return (scaleTypeResolver?.(...args) || defaultScaleTypeResolver(...args)) as ScaleType;
  };

  // Generate both scales and time labels in a single loop
  for (let i = 0; i < totalUnits; i++) {
    const current = generateNewDateByAddingScaleUnit(start, i, unit);
    if (current > end) break;

    const currentTime = current.getTime();
    const position = totalTimeSpan === 0 ? 0 : ((currentTime - startTime) / totalTimeSpan) * 100;

    // Add scale with type
    const type = resolverWithDefaultFallback(current, unit);
    scaleCounts[type]++;
    scales.push({ date: current, position, type });
  }

  const lastScale = scales[scales.length - 1];
  const endLabel = getRepresentativeDate(end, unit);
  const needsEndEntry = scales.length === 0 || lastScale.date.getTime() !== endLabel.getTime();

  if (needsEndEntry) {
    const endTime = endLabel.getTime();
    const endPosition = totalTimeSpan === 0 ? 100 : ((endTime - startTime) / totalTimeSpan) * 100;

    // Add end scale
    const endScaleType: ScaleType = 'short';
    scaleCounts[endScaleType]++;
    scales.push({ date: endLabel, position: endPosition, type: endScaleType });
  }

  return { scales, numberOfScales: scaleCounts };
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
  handleRef: RefObject<HTMLButtonElement | null>,
  cursorPosition: number,
  distance: number,
) => {
  if (!handleRef.current) return;
  const handleRect = handleRef.current.getBoundingClientRect();
  const x = cursorPosition;
  const y = handleRect.top - distance;
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
 */

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
  const result = new Date(date.getTime());

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

export const scaleDateFormatFn: DateFormatFn = ({ date }) => {
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (month === 0 && day === 1) {
    return 'YYYY';
  }

  if (day === 1) {
    return 'MMM';
  }

  return 'DD';
};

export const labelDateFormatFn: DateFormatFn = () => {
  return 'DD-MMM-YYYY';
};

/**
 * Default scale type resolver function.
 * Determines whether a date should be rendered as short/medium/long scale mark.
 *
 * Default logic:
 * - hour: long=year start, medium=month start, short=each hour
 * - day: long=month start, medium=Monday, short=each day
 * - month: long=year start, medium=quarter start, short=each month
 * - year: long=decade start, medium=5-year mark, short=each year
 *
 * @param date - The date to evaluate
 * @param timeUnit - Current time unit context
 * @returns Scale type for this date
 */
export const defaultScaleTypeResolver: ScaleTypeResolver = (
  date: Date,
  timeUnit: TimeUnit,
): ScaleType => {
  switch (timeUnit) {
    case 'hour': {
      const hour = date.getUTCHours();
      const day = date.getUTCDate();
      const month = date.getUTCMonth();

      // Year boundary: January 1st at 00:00
      if (month === 0 && day === 1 && hour === 0) return 'long';
      // Month boundary: 1st of month at 00:00
      if (day === 1 && hour === 0) return 'medium';
      // Each hour
      return 'short';
    }

    case 'day':
      // First day of month
      if (date.getUTCDate() === 1) return 'long';
      // Monday (week start)
      if (date.getUTCDay() === 1) return 'medium';
      // Each day
      return 'short';

    case 'month':
      // January (year start)
      if (date.getUTCMonth() === 0) return 'long';
      // Quarter starts (Apr, Jul, Oct)
      if (date.getUTCMonth() % 3 === 0) return 'medium';
      // Each month
      return 'short';

    case 'year':
      // Decade start (2020, 2030, etc.)
      if (date.getUTCFullYear() % 10 === 0) return 'long';
      // 5-year mark (2025, 2035, etc.)
      if (date.getUTCFullYear() % 5 === 0) return 'medium';
      // Each year
      return 'short';
  }
};

export function formatDate({
  date,
  format,
  locale = 'en',
  variant = 'scale',
  timeUnit,
}: {
  date: Date;
  format: Required<DateFormat>;
  locale: string;
  variant: 'scale' | 'label';
  timeUnit: TimeUnit;
}): string {
  const pattern =
    variant === 'scale'
      ? format.scale({ date, unit: timeUnit })
      : format.label({ date, unit: timeUnit });
  return pattern ? dayjs.utc(date).locale(locale).format(pattern) : '';
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
    leftOut: distanceFromLeftEdge < 0,
    rightOut: distanceFromRightEdge < 0,
  };
};

/**
 * Calculate the current start and end position of visible track with additional buffer in percentage,
 * the result can be used to filter out invisible scales and time labels.
 *
 * @param sliderPositionX - the horizontal position track scrolled
 * @param sliderContainerWidth - the width of visible track
 * @param trackWidth - the width of full track
 * @returns the current start and end position of visible track in percentage
 */
export const getTrackVisibleRange = ({
  sliderPositionX,
  sliderContainerWidth,
  trackWidth,
}: {
  sliderPositionX: number;
  sliderContainerWidth: number;
  trackWidth: number;
}) => {
  const scrollLeft = Math.abs(sliderPositionX);
  const viewportWidth = sliderContainerWidth;

  const visibleStartPercent = (scrollLeft / trackWidth) * 100;
  const visibleEndPercent = ((scrollLeft + viewportWidth) / trackWidth) * 100;

  const bufferPercent = ((viewportWidth * 0.5) / trackWidth) * 100;
  const startWithBuffer = Math.max(0, visibleStartPercent - bufferPercent);
  const endWithBuffer = Math.min(100, visibleEndPercent + bufferPercent);

  return { start: startWithBuffer, end: endWithBuffer };
};
