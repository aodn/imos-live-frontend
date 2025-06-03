import { cn } from '@/lib/utils';
import { Button, TriangleIcon } from '../';
import { TimeUnit } from './type';
import { useState, useRef, useEffect } from 'react';

type TimeUnitSelectionProps = {
  initialTimeUnit: TimeUnit;
  isMonthValid: boolean;
  isYearValid: boolean;
  onChange: (timeUnit: TimeUnit) => void;
  className?: string;
};

const TIME_UNITS: Array<TimeUnit> = ['day', 'month', 'year'];

export const TimeUnitSelection = ({
  initialTimeUnit,
  isMonthValid,
  isYearValid,
  className,
  onChange,
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

  return (
    <div
      className={cn(
        'flex flex-col grow-0 shrink-0 justify-between items-center h-full border-l w-16',
        className,
      )}
    >
      <p className="text-center text-base font-bold">{timeUnit.toUpperCase()}</p>
      <div className="flex flex-col">
        <Button
          aria-label="previous time unit"
          size={'icon'}
          variant={'ghost'}
          onClick={handleTimeUnitPreviousSelect}
          disabled={isPrevBtnDisabled()}
        >
          <TriangleIcon size="lg" color="imos-grey" />
        </Button>
        <Button
          aria-label="next time unit"
          size={'icon'}
          variant={'ghost'}
          className="rotate-180"
          onClick={handleTimeUnitNextSelect}
          disabled={isNextBtnDisabled()}
        >
          <TriangleIcon size="lg" color="imos-grey" />
        </Button>
      </div>
    </div>
  );
};
