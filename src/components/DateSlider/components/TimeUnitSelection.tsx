import { cn } from '@/utils';
import { Button, TriangleIcon } from '../..';
import { TimeUnit, TimeUnitSelectionProps } from '../type';
import { useState, useRef, useEffect, memo } from 'react';
import { useElementSize } from '@/hooks';

const TIME_UNITS: Array<TimeUnit> = ['day', 'month', 'year'];

export const TimeUnitSelection = memo(
  ({ initialTimeUnit, isMonthValid, isYearValid, className, onChange }: TimeUnitSelectionProps) => {
    const [timeUnit, setTimeUnit] = useState<TimeUnit>(initialTimeUnit);
    const timeUnitSelectionIndexRef = useRef(TIME_UNITS.indexOf(timeUnit) ?? 0);
    const { ref, heightBreakpoint } = useElementSize<HTMLDivElement>({
      debounceMs: 100,
      heightBreakpoints: {
        xs: 48,
        sm: 64,
        md: 96,
        xl: Infinity,
      },
    });

    const getIconSize = (heightBreakpoint?: string) => {
      if (heightBreakpoint === 'xs') return 'xs';
      if (heightBreakpoint === 'sm') return 'sm';
      if (heightBreakpoint === 'md') return 'base';
      if (heightBreakpoint === 'xl') return 'lg';
      return 'base';
    };

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
      <div className={cn('border-l', className)}>
        <div
          ref={ref}
          className={cn('flex flex-col grow-0 shrink-0 items-center h-full w-16 mx-auto', {
            'justify-between': heightBreakpoint === 'lg' || heightBreakpoint === 'base',
            'gap-y-1': heightBreakpoint === 'sm' || heightBreakpoint === 'xs',
          })}
        >
          <p
            className={cn('text-center text-base font-bold', {
              'text-xs': heightBreakpoint === 'sm' || heightBreakpoint === 'xs',
            })}
          >
            {timeUnit.toUpperCase()}
          </p>
          <div className="flex flex-col justify-between">
            <Button
              aria-label="previous time unit"
              size={'icon-only'}
              variant={'ghost'}
              onClick={handleTimeUnitPreviousSelect}
              disabled={isPrevBtnDisabled()}
            >
              <TriangleIcon size={getIconSize(heightBreakpoint)} color="imos-grey" />
            </Button>
            <Button
              aria-label="next time unit"
              size={'icon-only'}
              variant={'ghost'}
              className="rotate-180"
              onClick={handleTimeUnitNextSelect}
              disabled={isNextBtnDisabled()}
            >
              <TriangleIcon size={getIconSize(heightBreakpoint)} color="imos-grey" />
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

TimeUnitSelection.displayName = 'TimeUnitSelection';
