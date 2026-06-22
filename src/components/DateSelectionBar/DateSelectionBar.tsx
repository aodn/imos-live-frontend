import { TriangleIcon } from '../Icons';
import { CollapseToggle } from './CollapseToggle';
import { clearJumpToDate, setDate, useMapUIStore } from '@/store';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useDateSliderDates, useHasInitialQueryParam, useViewportSize } from '@/hooks';
import {
  DateSlider,
  type SliderExposedMethod,
  type PointValue,
  type SelectionResult,
} from '../DateSlider';
import { cn, minusOneUTCDay, toISODateString } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { metaDataManifestQueryOptions } from '@/api';
import { PRODUCT } from '@/constants';
import { useShallow } from 'zustand/shallow';
import {
  dateFormat,
  renderDateLabel,
  renderSelectionPanel,
  renderTimeUnitSelection,
  SELECTION_PANEL_WIDTH,
} from './renderProps';

type DateSelectionBarProps = { className?: string };

export const DateSelectionBar = memo(function DateSelectionBar({
  className,
}: DateSelectionBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [collapseAnimating, setCollapseAnimating] = useState(false);
  const { isSmallScreen } = useViewportSize();
  const { date, startDate, endDate } = useDateSliderDates(); //date in DateSlider is expected to be UTC only.
  const isDateInQueryParams = useHasInitialQueryParam('date');
  const { jumpTrigger, jumpDate } = useMapUIStore(
    useShallow(s => ({
      jumpTrigger: s.jumpToDate?.trigger,
      jumpDate: s.jumpToDate?.date,
    })),
  );
  const imperativeHandlerRef = useRef<SliderExposedMethod>(null);
  const collapsedWidth = isSmallScreen ? 0 : SELECTION_PANEL_WIDTH;

  const { data: latestDate } = useQuery({
    ...metaDataManifestQueryOptions(),
    select: data => data.products[PRODUCT.GSLA_OCEAN_GEOSTROPHIC_CURRENT]?.available_dates.at(-1),
    enabled: !isDateInQueryParams, //if date already selected, stop.
    retry: false,
  });

  useEffect(() => {
    //set date to latest available date when user has not selected date. Initial visit website.
    if (!latestDate || isDateInQueryParams) return;
    imperativeHandlerRef.current?.setDateTime(new Date(latestDate));
  }, [latestDate, isDateInQueryParams]);

  useEffect(() => {
    //user click on to latest available date button in LayerCard to latest available date.
    if (!jumpDate || !jumpTrigger) return;
    imperativeHandlerRef.current?.setDateTime(new Date(jumpDate));
    clearJumpToDate();
  }, [jumpTrigger, jumpDate]);

  const handleSelect = useCallback((v: SelectionResult) => {
    setDate(toISODateString((v as PointValue).point));
  }, []);

  // The picker drives the slider via the same imperative path as the date jump,
  // which moves the handle and fires the slider's onChange (→ store + URL).
  const handlePickDate = useCallback((picked: Date) => {
    imperativeHandlerRef.current?.setDateTime(picked);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapseAnimating(true);
    setCollapsed(prev => !prev);
  }, []);

  return (
    <div className={cn('flex', className)}>
      <div
        style={collapsed ? { width: collapsedWidth } : {}}
        onTransitionEnd={e => {
          if (e.propertyName === 'width') setCollapseAnimating(false);
        }}
        className={cn(
          'min-w-0 shadow-xl transition-[width] duration-300 ease-in-out',
          collapsed ? 'overflow-hidden' : 'overflow-visible flex-1',
        )}
      >
        <DateSlider
          imperativeRef={imperativeHandlerRef}
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
            trackActive: 'top-0 h-3 bg-imos-blue/60',
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
            selectionPanelEnabled: true,
            dateLabelEnabled: true,
            timeUnitSelectionEnabled: true,
          }}
          behavior={{
            scrollable: true,
            handleLabelDisabled: false,
            // Freeze the slider's repositioning while animate the collapse/expand width
            resizeObservationEnabled: !(collapsed || collapseAnimating),
          }}
          renderProps={{
            renderDateLabel,
            renderSelectionPanel: props =>
              renderSelectionPanel({
                ...props,
                date,
                min: startDate,
                max: minusOneUTCDay(endDate),
                onPickDate: handlePickDate,
              }),
            renderTimeUnitSelection,
          }}
        />
      </div>
      <CollapseToggle collapsed={collapsed} onToggle={toggleCollapsed} />
    </div>
  );
});
