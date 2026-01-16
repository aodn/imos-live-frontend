import { TriangleIcon } from '../Icons';
import { setDate } from '@/store';
import { memo, useCallback } from 'react';
import { useDateSliderDates } from '@/hooks';
import { DateSlider, type PointValue, type SelectionResult } from '../DateSlider';
import { cn, toISODateString } from '@/utils';
import {
  customDateLabelRenderer,
  customSelectionPanelRenderer,
} from '../DateSlider/components/defaultRender';

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
            gap: 64,
            width: { short: 1, medium: 2, long: 2 },
            height: { short: 18, medium: 36, long: 60 },
          },
          showEndLabel: false,
          trackPaddingX: 24,
          selectionPanelEnabled: true,
          dateLabelEnabled: true,
        }}
        behavior={{ scrollable: true, handleLabelDisabled: false }}
        renderProps={{
          renderDateLabel: customDateLabelRenderer,
          renderSelectionPanel: customSelectionPanelRenderer,
        }}
      />
    </div>
  );
});

DateSelectionBar.displayName = 'DateSelectionBar';
