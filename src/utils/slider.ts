import {
  NumOfScales,
  Scale,
  ScaleType,
  ScaleUnitConfig,
  TimeUnit,
} from '@/components/DateSlider/type';

// ----------------------------------
// Date Arithmetic
// ----------------------------------

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

export const getTotalTimeScales = (start: Date, end: Date, unit: TimeUnit): number => {
  const msDiff = end.getTime() - start.getTime();
  switch (unit) {
    case 'day':
      return Math.floor(msDiff / (1000 * 60 * 60 * 24));
    case 'month':
      return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    case 'year':
      return end.getFullYear() - start.getFullYear();
  }
};

export const getRepresentativeDate = (date: Date, unit: TimeUnit): Date => {
  switch (unit) {
    case 'day':
      return new Date(date.getFullYear(), date.getMonth(), 1);
    case 'month':
      return new Date(date.getFullYear(), 0, 1);
    case 'year':
      return new Date(Math.floor(date.getFullYear() / 10) * 10, 0, 1);
  }
};

// ----------------------------------
// Display Formatting
// ----------------------------------

export const formatDateForDisplay = (date: Date, unit: TimeUnit): string => {
  const thisYear = new Date().getFullYear();
  switch (unit) {
    case 'day':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== thisYear ? 'numeric' : undefined,
      });
    case 'month':
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    case 'year':
      return date.getFullYear().toString();
  }
};

// ----------------------------------
// Time Label Generation
// ----------------------------------

export const generateTimeLabels = (start: Date, end: Date, unit: TimeUnit): Date[] => {
  const labels: Date[] = [];
  const current = new Date(start);

  while (current <= end) {
    let label: Date | undefined;
    switch (unit) {
      case 'day':
        label = new Date(current.getFullYear(), current.getMonth(), 1);
        current.setMonth(current.getMonth() + 1);
        break;
      case 'month':
        label = new Date(current.getFullYear(), 0, 1);
        current.setFullYear(current.getFullYear() + 1);
        break;
      case 'year': {
        const decade = Math.floor(current.getFullYear() / 10) * 10;
        label = new Date(decade, 0, 1);
        current.setFullYear(decade + 10);
        break;
      }
    }

    if (
      label &&
      label.getTime() <= end.getTime() &&
      (labels.length === 0 || labels[labels.length - 1].getTime() !== label.getTime())
    ) {
      labels.push(label);
    }
  }

  const endLabel = getRepresentativeDate(end, unit);
  if (labels[labels.length - 1]?.getTime() !== endLabel.getTime()) {
    labels.push(endLabel);
  }

  return labels;
};

// ----------------------------------
// Slider/Track Measurements
// ----------------------------------

export const generateTrackWidth = (
  total: number,
  scales: NumOfScales,
  scaleUnitConfig: ScaleUnitConfig,
): number => {
  return (
    total * scaleUnitConfig.gap +
    scales.long * scaleUnitConfig.width.long +
    scales.medium * scaleUnitConfig.width.medium +
    scales.short * scaleUnitConfig.width.short
  );
};

export const calculateLabelPositions = (
  start: Date,
  labels: Date[],
  unit: TimeUnit,
  totalScaleUnits: number,
  trackWidth: number,
): { date: Date; position: number }[] => {
  const unitPixel = trackWidth / totalScaleUnits;

  return labels.map(label => {
    const offset = getTotalTimeScales(start, label, unit);
    return { date: label, position: offset * unitPixel };
  });
};

// ----------------------------------
// Ruler Scale Generation
// ----------------------------------

//generate all the scales that each sacle owns date, position and type, and amount of each type scale.
export const generateScalesWithInfo = (
  start: Date,
  end: Date,
  unit: TimeUnit,
  totalUnits: number,
): { scales: Scale[]; numberOfScales: NumOfScales } => {
  const scales: Scale[] = [];
  const scaleCounts = { short: 0, medium: 0, long: 0 };

  for (let i = 0; i <= totalUnits; i++) {
    const current = generateNewDateByAddingScaleUnit(start, i, unit);
    if (current > end) break;

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
    const position = (i / totalUnits) * 100;
    scales.push({ date: current, position, type });
  }

  return { scales, numberOfScales: scaleCounts };
};
