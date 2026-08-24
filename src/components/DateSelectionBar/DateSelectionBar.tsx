import { TriangleIcon } from '../Icons';
import { CollapseToggle } from './CollapseToggle';
import { DateSelectionPanel } from './DateSelectionPanel';
import { TimeUnitSelector } from './TimeUnitSelector';
import { clearJumpToDate, setDate, useMapUIStore } from '@/store';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDateSliderDates, useHasInitialQueryParam } from '@/hooks';
import {
  DateSlider,
  useDateSliderStore,
  type SliderExposedMethod,
  type PointValue,
  type SelectionResult,
} from '../DateSlider';
import { cn, naiveToDateOnly } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { metaDataManifestQueryOptions, pickDateByTimezone } from '@/api';
import { PRODUCT } from '@/constants';
import { useShallow } from 'zustand/shallow';
import { dateFormat, renderDateLabel } from './renderProps';

type DateSelectionBarProps = {
  className?: string;
  dragHandleClassName?: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export const DateSelectionBar = memo(function DateSelectionBar({
  className,
  dragHandleClassName,
  collapsed,
  onToggleCollapsed,
}: DateSelectionBarProps) {
  const [collapseAnimating, setCollapseAnimating] = useState(false);
  const { date, startDate, endDate } = useDateSliderDates(); //naive (timezone-free) date strings throughout.
  const isDateInQueryParams = useHasInitialQueryParam('date');
  const { jumpTrigger, jumpDate, timezone } = useMapUIStore(
    useShallow(s => ({
      jumpTrigger: s.jumpToDate?.trigger,
      jumpDate: s.jumpToDate?.date,
      timezone: s.timezone,
    })),
  );
  const imperativeHandlerRef = useRef<SliderExposedMethod>(null);
  const sliderStore = useDateSliderStore('day');

  const { data: latestDate } = useQuery({
    ...metaDataManifestQueryOptions(),
    select: data => {
      const latest = data.products
        .find(p => p.id === PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT)
        ?.available_dates.at(-1);
      return latest && pickDateByTimezone(latest, timezone);
    },
    enabled: !isDateInQueryParams, //if date already selected, stop.
    retry: false,
  });

  useEffect(() => {
    //set date to latest available date when user has not selected date. Initial visit website.
    if (!latestDate || isDateInQueryParams) return;
    imperativeHandlerRef.current?.setDateTime(latestDate);
  }, [latestDate, isDateInQueryParams]);

  useEffect(() => {
    //user click on to latest available date button in LayerCard to latest available date.
    if (!jumpDate || !jumpTrigger) return;
    imperativeHandlerRef.current?.setDateTime(jumpDate);
    clearJumpToDate();
  }, [jumpTrigger, jumpDate]);

  const handleSelect = useCallback((v: SelectionResult) => {
    setDate(naiveToDateOnly((v as PointValue).point));
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapseAnimating(true);
    onToggleCollapsed();
  }, [onToggleCollapsed]);

  return (
    <div className={cn('flex', className)}>
      {/* Left cap — stays visible while the slider collapses */}
      <DateSelectionPanel
        store={sliderStore}
        sliderRef={imperativeHandlerRef}
        fallbackDate={date}
        min={startDate}
        max={endDate}
        className={cn('shadow-xl', dragHandleClassName)}
      />

      {/* Collapsible region — the slider track and the time unit selector */}
      <div
        style={collapsed ? { width: 0 } : {}}
        onTransitionEnd={e => {
          if (e.propertyName === 'width') setCollapseAnimating(false);
        }}
        className={cn(
          'hidden md:flex min-w-0 shadow-xl transition-[width] duration-300 ease-in-out',
          collapsed ? 'overflow-hidden' : 'overflow-visible flex-1',
        )}
      >
        <div className="flex-1 min-w-0">
          <DateSlider
            imperativeRef={imperativeHandlerRef}
            stateStore={sliderStore}
            mode="point"
            min={startDate}
            max={endDate}
            value={{
              point: date,
            }}
            initialTimeUnit="day"
            dateFormat={dateFormat}
            icons={{
              point: <TriangleIcon size="lg" className="text-slate-700! text-shadow" />,
            }}
            classNames={{
              slider: 'frosted',
              sliderContainer: 'rounded-none',
              trackActive: 'hidden',
              trackInactive: 'top-0 h-3 bg-imos-blue/60',
              scaleMark: 'bg-imos-black',
              scaleLabel: 'text-imos-black ml-2',
              cursorLine: 'bg-imos-blue/60',
            }}
            onChange={handleSelect}
            layout={{
              width: 'fill',
              height: 64,
              scaleUnitConfig: {
                gap: 12,
                width: { short: 1, medium: 2, long: 2 },
                height: { short: 12, medium: 24, long: 64 },
              },
              showEndLabel: false,
              trackPaddingX: 24,
              dateLabelEnabled: true,
            }}
            behavior={{
              scrollable: true,
              handleLabelDisabled: false,
              // Freeze the slider's repositioning while animate the collapse/expand width
              resizeObservationEnabled: !(collapsed || collapseAnimating),
            }}
            renderProps={{
              renderDateLabel,
            }}
          />
        </div>

        {/* Right cap — hides with the slider on collapse */}
        <TimeUnitSelector store={sliderStore} sliderRef={imperativeHandlerRef} />
      </div>
      <CollapseToggle
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        className="hidden md:block"
      />
    </div>
  );
});
