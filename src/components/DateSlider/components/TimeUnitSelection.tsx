import { memo, useState, useRef, useEffect } from 'react';
import type { TimeUnit, TimeUnitSelectionProps } from '../type';

const TIME_UNITS: Array<TimeUnit> = ['day', 'month', 'year'];

export const TimeUnitSelection = memo(
  ({
    initialTimeUnit,
    isMonthValid,
    isYearValid,
    onChange,
    renderTimeUnitSelection,
  }: TimeUnitSelectionProps) => {
    const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);
    const timeUnitSelectionIndexRef = useRef(TIME_UNITS.indexOf(timeUnit) ?? 0);

    const isPrevBtnDisabled = () => {
      return timeUnitSelectionIndexRef.current === 0;
    };

    const isNextBtnDisabled = () => {
      const isLastTimeUnit = timeUnitSelectionIndexRef.current === TIME_UNITS.length - 1;
      const isMonthSelected = TIME_UNITS[timeUnitSelectionIndexRef.current] === 'month';
      return isLastTimeUnit || !isMonthValid || (isMonthSelected && !isYearValid);
    };

    useEffect(() => {
      if (onChange) onChange(timeUnit);
    }, [onChange, timeUnit]);

    const handleTimeUnitNextSelect = () => {
      if (timeUnitSelectionIndexRef.current < 2) timeUnitSelectionIndexRef.current++;
      if (timeUnitSelectionIndexRef.current > 2) timeUnitSelectionIndexRef.current = 0;
      setTimeUnit(TIME_UNITS[timeUnitSelectionIndexRef.current]);
    };

    const handleTimeUnitPreviousSelect = () => {
      if (timeUnitSelectionIndexRef.current > 0) timeUnitSelectionIndexRef.current--;
      if (timeUnitSelectionIndexRef.current < 0) timeUnitSelectionIndexRef.current = 2;
      setTimeUnit(TIME_UNITS[timeUnitSelectionIndexRef.current]);
    };

    return renderTimeUnitSelection({
      timeUnit,
      handleTimeUnitNextSelect,
      handleTimeUnitPreviousSelect,
      isNextBtnDisabled,
      isPrevBtnDisabled,
    });
  },
);

TimeUnitSelection.displayName = 'TimeUnitSelection';
