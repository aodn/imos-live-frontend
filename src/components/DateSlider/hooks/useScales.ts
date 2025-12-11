import { useMemo } from 'react';
import type { TimeUnit, ScaleTypeResolver } from '../type';
import { getTotalScales, generateScales } from '../utils';

export function useScales({
  startDate,
  endDate,
  timeUnit,
  scaleTypeResolver,
}: {
  startDate: Date;
  endDate: Date;
  timeUnit: TimeUnit;
  scaleTypeResolver?: ScaleTypeResolver;
}) {
  const totalScaleUnits = useMemo(
    () => getTotalScales(startDate, endDate, timeUnit),
    [startDate, endDate, timeUnit],
  );

  const { scales: allScales, numberOfScales } = useMemo(
    () => generateScales(startDate, endDate, timeUnit, totalScaleUnits, scaleTypeResolver),
    [endDate, startDate, timeUnit, totalScaleUnits, scaleTypeResolver],
  );

  return { allScales, numberOfScales, totalScaleUnits };
}
