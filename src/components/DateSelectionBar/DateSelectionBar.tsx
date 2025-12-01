import { TriangleIcon } from '../Icons';
import { cn, toISODateString } from '@/utils';
import { setDate } from '@/store';
import { memo, useCallback } from 'react';
import { DateSlider, PointValue, SelectionResult } from 'date-slider-lib';
import { dateLabelRender, timeDisplayRender, timeUnitSelectionRender } from '../DateSlider';
import { useDateSliderDates } from '@/hooks';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const { date, startDate, endDate } = useDateSliderDates();

  const handleSelect = useCallback(async (v: SelectionResult) => {
    setDate(toISODateString((v as PointValue).point));
  }, []);

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        mode="point"
        granularity="day"
        min={startDate}
        max={endDate}
        value={{
          point: date,
        }}
        initialTimeUnit="day"
        icons={{
          point: <TriangleIcon size="lg" className="text-slate-700! text-shadow" />,
        }}
        classNames={{
          slider: 'frosted',
          trackActive: 'bg-white/30',
          track: 'bg-white/10',
          scaleMark: 'bg-imos-grey',
        }}
        onChange={handleSelect as (v: SelectionResult) => void}
        layout={{
          width: 'fill',
          height: 80,
          scaleUnitConfig: {
            gap: 100,
            width: { short: 1, medium: 2, long: 2 },
            height: { short: 18, medium: 36, long: 60 },
          },
          trackPaddingX: 24,
        }}
        behaviour={{ scrollable: true, handleLabelDisabled: true }}
        renderProps={{
          renderDateLabel: dateLabelRender,
          renderTimeDisplay: timeDisplayRender,
          renderTimeUnitSelection: timeUnitSelectionRender,
        }}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
