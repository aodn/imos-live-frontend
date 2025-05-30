import { TimeUnit } from '@/components/Slider';

// Utility functions for date calculations
export const addTimeUnit = (date: Date, amount: number, unit: TimeUnit): Date => {
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

export const getTotalTimeUnitsByTimeMode = (date1: Date, date2: Date, unit: TimeUnit): number => {
  const diffMs = date2.getTime() - date1.getTime();
  switch (unit) {
    case 'day':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'month':
      return (
        (date2.getFullYear() - date1.getFullYear()) * 12 + (date2.getMonth() - date1.getMonth())
      );
    case 'year':
      return date2.getFullYear() - date1.getFullYear();
  }
};

export const formatDateForDisplay = (date: Date, unit: TimeUnit): string => {
  switch (unit) {
    case 'day':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    case 'month':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
    case 'year':
      return date.getFullYear().toString();
  }
};

export const generateTimeSteps = (
  startDate: Date,
  endDate: Date,
  unit: TimeUnit,
  stepSize: number,
): Date[] => {
  const steps: Date[] = [];
  const totalUnits = getTotalTimeUnitsByTimeMode(startDate, endDate, unit);
  const numberOfSteps = Math.min(10, Math.max(3, Math.floor(totalUnits / stepSize)));
  const actualStepSize = Math.floor(totalUnits / numberOfSteps);

  for (let i = 0; i <= numberOfSteps; i++) {
    const stepDate = addTimeUnit(startDate, i * actualStepSize, unit);
    if (stepDate <= endDate) {
      steps.push(stepDate);
    }
  }

  // Ensure end date is included
  if (steps[steps.length - 1]?.getTime() !== endDate.getTime()) {
    steps.push(endDate);
  }

  return steps;
};
