import type { TimeUnit, TimeUnitSelectionProps } from '../type';
import { memo, useState, useRef, useEffect } from 'react';

const TIME_UNITS: Array<TimeUnit> = ['hour', 'day', 'month', 'year'];

export const TimeUnitSelection = memo(function TimeUnitSelection({
  initialTimeUnit,
  isMonthValid,
  isYearValid,
  onChange,
  renderTimeUnitSelection,
}: TimeUnitSelectionProps) {
  const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);
  const timeUnitSelectionIndexRef = useRef(Math.max(0, TIME_UNITS.indexOf(timeUnit)));

  const isPrevBtnDisabled = () => {
    return timeUnitSelectionIndexRef.current === 0;
  };

  const isNextBtnDisabled = () => {
    const current = timeUnitSelectionIndexRef.current;
    if (current === TIME_UNITS.length - 1) return true;
    const nextUnit = TIME_UNITS[current + 1];
    if (nextUnit === 'month' && !isMonthValid) return true;
    if (nextUnit === 'year' && !isYearValid) return true;
    return false;
  };

  useEffect(() => {
    if (onChange) onChange(timeUnit);
  }, [onChange, timeUnit]);

  const selectTimeUnit = (unit: TimeUnit) => {
    const index = TIME_UNITS.indexOf(unit);
    if (index === -1) return;
    timeUnitSelectionIndexRef.current = index;
    setTimeUnit(unit);
  };

  const handleTimeUnitNextSelect = () => {
    if (timeUnitSelectionIndexRef.current < TIME_UNITS.length - 1) {
      selectTimeUnit(TIME_UNITS[timeUnitSelectionIndexRef.current + 1]);
    }
  };

  const handleTimeUnitPreviousSelect = () => {
    if (timeUnitSelectionIndexRef.current > 0) {
      selectTimeUnit(TIME_UNITS[timeUnitSelectionIndexRef.current - 1]);
    }
  };

  return renderTimeUnitSelection({
    timeUnit,
    availableTimeUnits: TIME_UNITS,
    isMonthValid,
    isYearValid,
    selectTimeUnit,
    handleTimeUnitNextSelect,
    handleTimeUnitPreviousSelect,
    isNextBtnDisabled,
    isPrevBtnDisabled,
  });
});

TimeUnitSelection.displayName = 'TimeUnitSelection';
