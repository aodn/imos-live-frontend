import { TriangleIcon } from '..';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import {
  convertUTCToLocalDateTime,
  getLast7DatesEnding3DaysAgo,
  shortDateFormatToUTC,
  toShortDateFormat,
} from '@/utils';
import { useMapUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = ({ className }: DateSelectionBarProps) => {
  const { dataset, setDataset } = useMapUIStore(
    useShallow(s => ({
      dataset: s.dataset,
      setDataset: s.setDataset,
    })),
  );

  const setSliderDateTimeRef = useRef<
    ((date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => void) | null
  >(null);
  const isUpdatingFromUrlRef = useRef(false);

  const lastSevenDays = useMemo(() => getLast7DatesEnding3DaysAgo('yyyy-mm-dd'), []);

  const handleSliderReady = (
    setDateTime: (date: Date, target?: 'point' | 'rangeStart' | 'rangeEnd') => void,
  ) => {
    setSliderDateTimeRef.current = setDateTime;
  };

  const handleSelect = (v: PointSelection) => {
    //currently, gsla ocean current data is naming in yy-mm-dd pattern, so need to convert same fromat.
    if (isUpdatingFromUrlRef.current) return;
    setDataset(toShortDateFormat(v.point));
  };

  useEffect(() => {
    if (setSliderDateTimeRef.current && dataset) {
      const dateFromDataset = convertUTCToLocalDateTime(shortDateFormatToUTC(dataset));

      isUpdatingFromUrlRef.current = true;
      setSliderDateTimeRef.current(dateFromDataset, 'point');

      setTimeout(() => {
        isUpdatingFromUrlRef.current = false;
      }, 10);
    }
  }, [dataset]);

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={convertUTCToLocalDateTime(new Date(lastSevenDays[0]))}
        endDate={convertUTCToLocalDateTime(new Date(lastSevenDays.at(-1)!))}
        initialPoint={convertUTCToLocalDateTime(shortDateFormatToUTC(dataset))}
        pointHandleIcon={<TriangleIcon size="xxl" color="imos-grey" />}
        wrapperClassName="rounded-xl bg-gray-300/70"
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        scrollable={true}
        scaleUnitConfig={{
          gap: 36,
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 24, medium: 48, long: 108 },
        }}
        onSliderReady={handleSliderReady}
      />
    </div>
  );
};
