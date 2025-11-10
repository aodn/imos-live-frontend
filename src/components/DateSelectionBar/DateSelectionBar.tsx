import { TriangleIcon } from '../Icons';
import { DateSlider, PointSelection, SelectionResult, SliderExposedMethod } from '../DateSlider';
import { getLast7Dates, dateToUTC, toDateFormatString, cn } from '@/utils';
import { useMapUIStore } from '@/store';
import { memo, useCallback, useMemo, useRef } from 'react';
import { useShallow } from 'zustand/shallow';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const { dataset, setDataset } = useMapUIStore(
    useShallow(s => ({
      dataset: s.dataset,
      setDataset: s.setDataset,
    })),
  );

  const dateSliderMethodRef = useRef<SliderExposedMethod>(null);

  const lastSevenDays = useMemo(() => getLast7Dates('yyyy-mm-dd'), []);
  const startDate = useMemo(() => new Date(lastSevenDays[0]), [lastSevenDays]);
  const endDate = useMemo(() => {
    const last = new Date(lastSevenDays.at(-1)!);
    last.setDate(last.getDate() + 1);
    return last;
  }, [lastSevenDays]);

  const handleSelect = useCallback(
    (v: PointSelection) => {
      setDataset(toDateFormatString(v.point));
    },
    [setDataset],
  );

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={startDate}
        endDate={endDate}
        initialPoint={dateToUTC(dataset)}
        pointHandleIcon={<TriangleIcon size="xxl" className="text-slate-700! text-shadow" />}
        sliderClassName="frosted"
        timeUnitSlectionClassName="frosted"
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        scrollable
        scaleUnitConfig={{
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 18, medium: 36, long: 60 },
        }}
        sliderHeight={110}
        sliderWidth={'fill'}
        imperativeHandleRef={dateSliderMethodRef}
        pointLabelPersistent
        isTimeLabelPerDay
        withEndLabel={false}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
