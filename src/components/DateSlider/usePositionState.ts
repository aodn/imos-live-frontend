import { clampPercent } from '@/utils';
import { useCallback, useState, useRef, useEffect } from 'react';
import { SliderProps, TimeUnit } from './type';
import { getPeriodTimeScales } from './dateSliderUtils';

export function usePositionState(
  initialRange: SliderProps['initialRange'],
  initialPoint: SliderProps['initialPoint'],
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

      const diff = getPeriodTimeScales(startDate, targetDate, timeUnit);
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
