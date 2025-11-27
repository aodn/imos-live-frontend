import { TriangleIcon } from '../Icons';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import { dateToUTC, toDateFormatString, cn } from '@/utils';
import { setDate } from '@/store';
import { memo, useCallback } from 'react';
import { useDateSliderDates } from '@/hooks';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const { date, startDate, endDate } = useDateSliderDates();

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
