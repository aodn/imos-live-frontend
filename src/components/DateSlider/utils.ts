import {
  NumOfScales,
  Scale,
  ScaleType,
  ScaleUnitConfig,
  SelectionResult,
  TimeLabel,
  TimeUnit,
  ViewMode,
} from '@/components/DateSlider/type';
import { clampPercent } from '@/utils';

//add a certain amount of scale unit to a date to get new date, when unit is day, it is to add some amount of days.
//when unit is month, it is to add some amount of months. when unit is year, it is to add some amount of years.
export const generateNewDateByAddingScaleUnit = (
  date: Date,
  amount: number,
  unit: TimeUnit,
): Date => {
  const newDate = new Date(date);
  switch (unit) {
    case 'day':
      newDate.setDate(newDate.getDate() + amount);
      break;
    case 'month':
      newDate.setMonth(newDate.getMonth() + amount);
      break;
    case 'year':
      newDate.setFullYear(newDate.getFullYear() + amount);
      break;
  }
  return newDate;
};

/**
 * calculate total number of scales for different combination of start date, end date and unit as 'day'|'month'|'year'.
 * when unit is day, if there are 49 hours between start and end, the number of scales will be Math.round(49 / 24 )=3.
 * when unit is month, if 2 months from start to end, the number of scales will be 2.
 * when unit is year, if 2 years from start to end, the number of scales will be 2.
 * @param start Date
 * @param end Date
 * @param unit 'day'|'month'|'year'
 * @returns
 */
export const getTotalScales = (start: Date, end: Date, unit: TimeUnit): number => {
  const msDiff = end.getTime() - start.getTime();

  switch (unit) {
    case 'day':
      return Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    case 'month':
      return (
        (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth() + 1)
      );
    case 'year':
      return end.getFullYear() - start.getFullYear() + 1;
  }
};

export const getRepresentativeDate = (date: Date, unit: TimeUnit): Date => {
  switch (unit) {
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    case 'month':
      return new Date(date.getFullYear(), 0, 1);
    case 'year':
      return new Date(Math.floor(date.getFullYear() / 10) * 10, 0, 1);
  }
};

export const formatDateForDisplay = ({
  date,
  fullDate = false,
}: {
  date: Date;
  fullDate?: boolean;
}): string => {
  const day = date.getDate();
  const month = date.getMonth();

  if (fullDate) {
    return date.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  if (month === 0 && day === 1) {
    return date.toLocaleDateString('en-AU', { year: 'numeric' });
  }

  if (day === 1) {
    return date.toLocaleDateString('en-AU', { month: 'short' });
  }

  return date.toLocaleDateString('en-AU', { day: 'numeric' });
};

// Slider/Track Measurements
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

// Scale Generation
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
        type = current.getDate() === 1 ? 'long' : current.getDay() === 1 ? 'medium' : 'short';
        break;
      case 'month':
        type =
          current.getMonth() === 0 ? 'long' : current.getMonth() % 3 === 0 ? 'medium' : 'short';
        break;
      case 'year':
        type =
          current.getFullYear() % 10 === 0
            ? 'long'
            : current.getFullYear() % 5 === 0
              ? 'medium'
              : 'short';
        break;
    }

    scaleCounts[type]++;
    scales.push({ date: current, position, type });
  }

  // If we don't have a scale exactly at the end date, add one
  if (scales.length > 0 && scales[scales.length - 1].date.getTime() !== endTime) {
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
        labelDate = new Date(current.getFullYear(), current.getMonth(), current.getDate());
        current.setDate(current.getDate() + 1);
        break;
      case 'month':
        labelDate = new Date(current.getFullYear(), 0, 1);
        current.setFullYear(current.getFullYear() + 1);
        break;
      case 'year': {
        const decade = Math.floor(current.getFullYear() / 10) * 10;
        labelDate = new Date(decade, 0, 1);
        current.setFullYear(decade + 10);
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

export const getPercentageFromMouseEvent = (
  e: React.MouseEvent<Element, MouseEvent> | MouseEvent,
  trackRef: React.RefObject<HTMLDivElement | null>,
): number => {
  if (!trackRef.current) return 0;
  const rect = trackRef.current.getBoundingClientRect();
  return clampPercent(((e.clientX - rect.left) / rect.width) * 100);
};

export const getPercentageFromTouchEvent = (
  e: React.TouchEvent<Element> | TouchEvent,
  trackRef: React.RefObject<HTMLDivElement | null>,
): number => {
  if (!trackRef.current || !e.touches.length) return 0;
  const rect = trackRef.current.getBoundingClientRect();
  const touch = e.touches[0] || e.changedTouches[0];
  return clampPercent(((touch.clientX - rect.left) / rect.width) * 100);
};

export const getDateFromPercent = (percent: number, startDate: Date, endDate: Date): Date => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const targetTime = startTime + (percent / 100) * (endTime - startTime);
  return new Date(targetTime);
};

export const getPercentFromDate = (date: Date, startDate: Date, endDate: Date): number => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  const targetTime = date.getTime();
  const clampedTime = Math.max(startTime, Math.min(endTime, targetTime));
  const percent = ((clampedTime - startTime) / (endTime - startTime)) * 100;
  return clampPercent(percent);
};

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
      return { range: { start: startLabel, end: endLabel } };
    case 'point':
      return { point: pointLabel };
    case 'combined':
      return {
        range: { start: startLabel, end: endLabel },
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
