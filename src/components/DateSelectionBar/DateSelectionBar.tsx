import { TriangleIcon } from '../Icons';
import { setDate } from '@/store';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useDateQueryParams, useDateSliderDates } from '@/hooks';
import {
  DateSlider,
  type SliderExposedMethod,
  type PointValue,
  type SelectionResult,
} from '../DateSlider';
import {
  cn,
  getLatestFulfilledDate,
  getLast7Dates,
  toISODateString,
  toISOFromCompact,
} from '@/utils';
import {
  customDateLabelRenderer,
  customSelectionPanelRenderer,
} from '../DateSlider/components/defaultRender';
import { useQuery } from '@tanstack/react-query';
import { fileExist, gslaUrl } from '@/api';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(({ className }: DateSelectionBarProps) => {
  const { date, startDate, endDate } = useDateSliderDates();
  const { isDateInQueryParams } = useDateQueryParams();
  const imperativeHandlerRef = useRef<SliderExposedMethod>(null);

  const last7Dates = getLast7Dates('yyyymmdd');

  const { data: gslaDates } = useQuery({
    queryKey: ['gsla', last7Dates],
    queryFn: () => {
      const candidates = last7Dates.map(d => fileExist(gslaUrl(d), d));
      return Promise.allSettled(candidates);
    },
    enabled: !isDateInQueryParams, //if date already selected, stop.
  });

  useEffect(() => {
    //set date to latest available date when use has not selected date
    if (!gslaDates || isDateInQueryParams) return;

    const latestDate = getLatestFulfilledDate(gslaDates);
    if (latestDate) {
      imperativeHandlerRef.current?.setDateTime(new Date(toISOFromCompact(latestDate)));
    }
  }, [gslaDates, isDateInQueryParams]);

  const handleSelect = useCallback(async (v: SelectionResult) => {
    setDate(toISODateString((v as PointValue).point));
  }, []);

  return (
    <div className={cn('shadow-xl', className)}>
      <DateSlider
        imperativeRef={imperativeHandlerRef}
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
            gap: 62,
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
