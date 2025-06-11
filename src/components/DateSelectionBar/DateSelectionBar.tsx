import { TriangleIcon } from '..';
import { DateSlider, PointSelection, SelectionResult, SliderExposedMethod } from '../DateSlider';
import {
  convertUTCToLocalDateTime,
  getLast7DatesEnding3DaysAgo,
  shortDateFormatToUTC,
  toShortDateFormat,
} from '@/utils';
import { useMapUIStore } from '@/store';
import { cn } from '@/utils';
import { useEffect, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';
import { useElementSize } from '@/hooks';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = ({ className }: DateSelectionBarProps) => {
  const { dataset, setDataset } = useMapUIStore(
    useShallow(s => ({
      dataset: s.dataset,
      setDataset: s.setDataset,
    })),
  );
  const { ref, size } = useElementSize<HTMLDivElement>();

  const dataSliderMethod = useRef<SliderExposedMethod>(null);
  const isUpdatingFromUrl = useRef(false);
  const lastProcessedDataset = useRef<string>(null);
  const updateAttempts = useRef(0);

  const lastSevenDays = useMemo(() => getLast7DatesEnding3DaysAgo('yyyy-mm-dd'), []);

  const handleSelect = (v: PointSelection) => {
    //currently, gsla ocean current data is naming in yy-mm-dd pattern, so need to convert same fromat.
    if (isUpdatingFromUrl.current) return;
    setDataset(toShortDateFormat(v.point));
  };

  useEffect(() => {
    if (!dataSliderMethod.current || !dataset) return;

    const hasDatasetChanged = lastProcessedDataset.current !== dataset;

    if (hasDatasetChanged) {
      updateAttempts.current++;
      lastProcessedDataset.current = dataset;
    }

    if (updateAttempts.current > 2) return;

    const dateTime = convertUTCToLocalDateTime(shortDateFormatToUTC(dataset));

    isUpdatingFromUrl.current = true;
    dataSliderMethod.current.setDateTime(dateTime, 'point');

    const timeoutId = setTimeout(() => {
      isUpdatingFromUrl.current = false;
    }, 10);

    return () => clearTimeout(timeoutId);
  }, [dataset]);

  return (
    <div ref={ref} className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={convertUTCToLocalDateTime(new Date(lastSevenDays[0]))}
        endDate={convertUTCToLocalDateTime(new Date(lastSevenDays.at(-1)!))}
        initialPoint={convertUTCToLocalDateTime(shortDateFormatToUTC(dataset))}
        pointHandleIcon={<TriangleIcon size="xxl" color="imos-grey" />}
        wrapperClassName="bg-gray-300/70 w-full"
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        scrollable={true}
        scaleUnitConfig={{
          gap: size.width / 7,
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 12, medium: 24, long: 60 },
        }}
        sliderHeight={60}
        sliderWidth={size.width}
        imperativeHandleRef={dataSliderMethod}
      />
    </div>
  );
};
