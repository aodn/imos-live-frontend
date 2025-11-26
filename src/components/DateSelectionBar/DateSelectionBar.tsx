import { TriangleIcon } from '../Icons';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import { dateToUTC, toDateFormatString, cn, getLast30Dates } from '@/utils';
import { useMapUIStore, setDate } from '@/store';
import { memo, useCallback, useMemo } from 'react';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const date = useMapUIStore(s => s.date);

  const last30Days = useMemo(() => getLast30Dates('yyyy-mm-dd'), []);
  const startDate = useMemo(() => new Date(last30Days[0]), [last30Days]);
  const endDate = useMemo(() => {
    const last = new Date(last30Days.at(-1)!);
    last.setDate(last.getDate() + 1);
    return last;
  }, [last30Days]);

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
        timeUnitSelectionClassName="frosted"
        trackActiveClassName="hidden"
        onChange={handleSelect as (v: SelectionResult) => void}
        scrollable
        scaleUnitConfig={{
          gap: 100,
          width: { short: 1, medium: 2, long: 2 },
          height: { short: 18, medium: 36, long: 60 },
        }}
        sliderHeight={64}
        sliderWidth={'fill'}
        withEndLabel={false}
        timeUnitSelectionEnabled={false}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
