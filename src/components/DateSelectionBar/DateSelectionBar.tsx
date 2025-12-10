import { TriangleIcon } from '../Icons';
import { setDate } from '@/store';
import { memo, useCallback } from 'react';
import { useDateSliderDates } from '@/hooks';
import type { PointValue, SelectionResult } from '../DateSlider';
import { dateLabelRender, DateSlider, timeDisplayRender } from '../DateSlider';
import { cn, toISODateString } from '@/utils';

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
          height: 64,
          scaleUnitConfig: {
            gap: 100,
            width: { short: 1, medium: 2, long: 2 },
            height: { short: 18, medium: 36, long: 60 },
          },
          trackPaddingX: 24,
        }}
        behavior={{ scrollable: true, handleLabelDisabled: false }}
        renderProps={{
          renderDateLabel: dateLabelRender,
          renderTimeDisplay: timeDisplayRender,
          // renderTimeUnitSelection: timeUnitSelectionRender,
        }}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
