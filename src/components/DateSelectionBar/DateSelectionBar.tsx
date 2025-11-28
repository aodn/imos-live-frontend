import { TriangleIcon } from '../Icons';
import { DateSlider, PointSelection, SelectionResult } from '../DateSlider';
import { toISODateString } from '../DateSlider/utils';
import { cn } from '@/utils';
import { setDate } from '@/store';
import { memo, useCallback } from 'react';
import { useDateSliderDates } from '@/hooks';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const { date, startDate, endDate } = useDateSliderDates();

  const handleSelect = useCallback(async (v: PointSelection) => {
    const dateString = toISODateString(v.point);
    setDate(dateString);
  }, []);

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        viewMode="point"
        initialTimeUnit="day"
        granularity="day"
        startDate={startDate}
        endDate={endDate}
        initialPoint={date}
        pointHandleIcon={<TriangleIcon size="xxl" className="text-slate-700! text-shadow" />}
        sliderClassName="frosted"
        timeUnitSelectionClassName="frosted"
        timeDisplayCLassName="frosted"
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
        timeDisplayEnabled
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
