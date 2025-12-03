import { clampPercent } from '@/utils';
import { useCallback, useEffect, useRef, useState } from 'react';
import { TimeUnit } from '../type';
import { getTotalScales } from '../utils';

/**
 * Custom hook to manage slider position state (range start/end and point position).
 *
 * Manages both state and refs for position values to avoid stale closures in callbacks.
 * Calculates initial positions based on the provided dates and time unit.
 *
 * @param initialRange - Optional initial range selection
 * @param initialPoint - Optional initial point selection
 * @param startDate - Start date of the slider range
 * @param timeUnit - Current time unit (day/month/year)
 * @param totalScaleUnits - Total number of scale units in the range
 * @returns Position state and setters, plus refs for stable access in callbacks
 */
export function usePositionState(
  initialRange: { start: Date; end: Date } | undefined,
  initialPoint: Date | undefined,
  startDate: Date,
  timeUnit: TimeUnit,
  totalScaleUnits: number,
) {
  const getInitialPosition = useCallback(
    (type: 'rangeStart' | 'rangeEnd' | 'point') => {
      const valueMap = {
        rangeStart: initialRange?.start,
        rangeEnd: initialRange?.end,
        point: initialPoint,
      };

      const defaultMap = {
        rangeStart: 0,
        rangeEnd: 100,
        point: 50,
      };

      const targetDate = valueMap[type];
      if (!targetDate) return defaultMap[type];

      const diff = getTotalScales(startDate, targetDate, timeUnit);
      return clampPercent((diff / totalScaleUnits) * 100);
    },
    [initialRange, initialPoint, startDate, timeUnit, totalScaleUnits],
  );

  const [rangeStart, setRangeStart] = useState(() => getInitialPosition('rangeStart'));
  const [rangeEnd, setRangeEnd] = useState(() => getInitialPosition('rangeEnd'));
  const [pointPosition, setPointPosition] = useState(() => getInitialPosition('point'));

  // Use refs for stable references in callbacks
  const rangeStartRef = useRef(rangeStart);
  const rangeEndRef = useRef(rangeEnd);
  const pointPositionRef = useRef(pointPosition);

  useEffect(() => {
    rangeStartRef.current = rangeStart;
    rangeEndRef.current = rangeEnd;
    pointPositionRef.current = pointPosition;
  }, [rangeStart, rangeEnd, pointPosition]);

  return {
    rangeStart,
    rangeEnd,
    pointPosition,
    setRangeStart,
    setRangeEnd,
    setPointPosition,
    rangeStartRef,
    rangeEndRef,
    pointPositionRef,
  };
}
