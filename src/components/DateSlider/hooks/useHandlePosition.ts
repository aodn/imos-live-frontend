import { useCallback, type MutableRefObject } from 'react';
import { getPercentFromDate, getDateFromPercent, addTime, clampPercent } from '../utils';
import { PERCENTAGE } from '../constants';
import type { DragHandle, ViewMode, Step, StepFn, TimeUnit } from '../type';
import { minusOneUTCDay } from '@/utils';

type UseHandlePositionParams = {
  minGapPercent: number;
  startDate: Date;
  endDate: Date;
  viewMode: ViewMode;
  setRangeStartPosition: (position: number) => void;
  setRangeEndPosition: (position: number) => void;
  setPointPosition: (position: number) => void;
  rangeStartRef: MutableRefObject<number>;
  rangeEndRef: MutableRefObject<number>;
  pointPositionRef: MutableRefObject<number>;
  autoScrollToVisibleAreaRef: MutableRefObject<boolean>;
  step?: Step | StepFn;
  timeUnit: TimeUnit;
};

/**
 * Hook to manage handle position updates for both direct position changes and date-based updates.
 * Encapsulates logic for clamping, gap constraints, and auto-scroll triggers.
 */
export function useHandlePosition({
  minGapPercent,
  startDate,
  endDate,
  viewMode,
  setRangeStartPosition,
  setRangeEndPosition,
  setPointPosition,
  rangeStartRef,
  rangeEndRef,
  pointPositionRef,
  autoScrollToVisibleAreaRef,
  step,
  timeUnit,
}: UseHandlePositionParams) {
  /**
   * Update handle position by percentage with gap constraints
   */
  const updateHandlePosition = useCallback(
    (handle: DragHandle, percentage: number) => {
      const clampedPercentage = clampPercent(percentage, PERCENTAGE.MAX);

      switch (handle) {
        case 'start': {
          const newStart = Math.max(
            0,
            Math.min(clampedPercentage, rangeEndRef.current - minGapPercent),
          );
          setRangeStartPosition(newStart);
          break;
        }
        case 'end': {
          const newEnd = Math.min(
            clampedPercentage,
            Math.max(percentage, rangeStartRef.current + minGapPercent), // Use original percentage here
          );
          setRangeEndPosition(newEnd);
          break;
        }
        case 'point': {
          let validDate = getDateFromPercent(clampedPercentage, startDate, endDate);

          if (validDate < startDate || validDate >= endDate) {
            validDate = minusOneUTCDay(endDate); //because endDate added one day previously to be exclusive in useDateSliderDates.
          }

          setPointPosition(getPercentFromDate(validDate, startDate, endDate));
          break;
        }
      }
    },
    [
      rangeEndRef,
      minGapPercent,
      setRangeStartPosition,
      rangeStartRef,
      setRangeEndPosition,
      setPointPosition,
      startDate,
      endDate,
    ],
  );

  /**
   * Sets the date time for the specified target handle
   *
   * Accepts UTC Date objects only. Consumers should use toUTCDate()
   * to convert their data before passing to this function.
   *
   * @param date - UTC Date object
   * @param target - The target handle ('point', 'rangeStart', 'rangeEnd')
   */
  const setDateTime = useCallback(
    (date: Date, target?: DragHandle) => {
      if (date < startDate || date >= endDate) {
        date = minusOneUTCDay(endDate); //because endDate added one day previously to be exclusive in useDateSliderDates.
      }
      // Date is expected to be UTC, no conversion needed
      const percentage = getPercentFromDate(date, startDate, endDate);
      // Resolve target handle if not provided
      let actualTarget = target;
      if (!actualTarget) {
        switch (viewMode) {
          case 'point':
            actualTarget = 'point';
            break;
          case 'range': {
            const distanceToStart = Math.abs(percentage - rangeStartRef.current);
            const distanceToEnd = Math.abs(percentage - rangeEndRef.current);
            actualTarget = distanceToStart < distanceToEnd ? 'start' : 'end';
            break;
          }
          case 'combined':
            actualTarget = 'point';
            break;
        }
      }

      updateHandlePosition(actualTarget, percentage);

      autoScrollToVisibleAreaRef.current = true;
    },
    [
      startDate,
      endDate,
      updateHandlePosition,
      autoScrollToVisibleAreaRef,
      viewMode,
      rangeStartRef,
      rangeEndRef,
    ],
  );

  /**
   * Move the handle by the configured step amount
   *
   * @param direction - 'forward' or 'backward'
   * @param target - Which handle to move ('start', 'end', 'point'). Defaults based on viewMode.
   */
  const moveByStep = useCallback(
    (direction: 'forward' | 'backward', target?: DragHandle) => {
      // Resolve target handle if not provided
      let actualTarget = target;
      if (!actualTarget) {
        switch (viewMode) {
          case 'point':
            actualTarget = 'point';
            break;
          case 'range':
            actualTarget = 'start';
            break;
          case 'combined':
            actualTarget = 'point';
            break;
        }
      }

      const positionMap = {
        start: rangeStartRef.current,
        end: rangeEndRef.current,
        point: pointPositionRef.current,
      } as const;

      // Get current position for the target handle
      const currentPosition = positionMap[actualTarget];

      const date = getDateFromPercent(currentPosition, startDate, endDate);

      // Resolve step - either use static Step or call StepFn with context
      let resolvedStep: Step;
      if (typeof step === 'function') {
        // It's a StepFn - call it with context
        resolvedStep = step({
          date,
          unit: timeUnit,
          handle: actualTarget,
        });
      } else {
        // It's a static Step or undefined
        resolvedStep = step || { amount: 1, unit: timeUnit };
      }

      const { amount, unit } = resolvedStep;
      const deltaAmount = direction === 'forward' ? amount : -amount;
      const newDate = addTime(date, deltaAmount, unit);

      setDateTime(newDate, actualTarget);
    },
    [
      viewMode,
      rangeStartRef,
      rangeEndRef,
      pointPositionRef,
      startDate,
      endDate,
      step,
      timeUnit,
      setDateTime,
    ],
  );

  return { setDateTime, moveByStep, updateHandlePosition };
}
