import { TriangleIcon } from '../Icons';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import { getLast7Dates, dateToUTC, toDateFormatString, cn } from '@/utils';
import { useMapUIStore, setDate } from '@/store';
import { memo, useCallback, useMemo } from 'react';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const date = useMapUIStore(s => s.date);

  const lastSevenDays = useMemo(() => getLast7Dates('yyyy-mm-dd'), []);
  const startDate = useMemo(() => new Date(lastSevenDays[0]), [lastSevenDays]);
  const endDate = useMemo(() => {
    const last = new Date(lastSevenDays.at(-1)!);
    last.setDate(last.getDate() + 1);
    return last;
  }, [lastSevenDays]);

  const handleSelect = useCallback(async (v: PointSelection) => {
    const date = toDateFormatString(v.point);
    setDate(date);
  }, []);

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        startDate={startDate}
        endDate={endDate}
        initialPoint={dateToUTC(date)}
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
        pointLabelPersistent
        isTimeLabelPerDay
        withEndLabel={false}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
