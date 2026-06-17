import { TriangleIcon } from '../Icons';
import { clearJumpToDate, setDate, useMapUIStore } from '@/store';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useDateSliderDates, useHasInitialQueryParam } from '@/hooks';
import {
  DateSlider,
  type SliderExposedMethod,
  type PointValue,
  type SelectionResult,
  type SelectionPanelRenderProps,
  customDateLabelRenderer,
} from '../DateSlider';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn, toISODateString } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { metaDataManifestQueryOptions } from '@/api';
import { PRODUCT } from '@/constants';
import { useShallow } from 'zustand/shallow';

type DateSelectionBarProps = { className?: string };

function renderSelectionPanel({ toNextDate, toPrevDate, dateLabel }: SelectionPanelRenderProps) {
  return (
    <div className="hidden md:flex items-center gap-1 frosted rounded-l-lg px-2 py-1.5 w-42 shrink-0 overflow-hidden border-r border-imos-blue">
      <button
        onClick={toPrevDate}
        className="p-1 hover:bg-white/30 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Previous date"
      >
        <ChevronLeftIcon className="w-4 h-4 text-imos-grey" />
      </button>
      <span className="text-sm font-semibold text-imos-black flex-1 text-center whitespace-nowrap">
        {dateLabel}
      </span>
      <button
        onClick={toNextDate}
        className="p-1 hover:bg-white/30 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Next date"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-grey" />
      </button>
    </div>
  );
}

export const DateSelectionBar = memo(function DateSelectionBar({
  className,
}: DateSelectionBarProps) {
  const { date, startDate, endDate } = useDateSliderDates();
  // Does date in url (Snapshot at mount, beacuse history.replaceState used when set date, which doesn't trigger popstate, so React Router doesn't see the update. See store/urlSync.ts)
  const isDateInQueryParams = useHasInitialQueryParam('date');
  const { jumpTrigger, jumpDate } = useMapUIStore(
    useShallow(s => ({
      jumpTrigger: s.jumpToDate?.trigger,
      jumpDate: s.jumpToDate?.date,
    })),
  );
  const imperativeHandlerRef = useRef<SliderExposedMethod>(null);

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
        dateFormat={{ label: () => 'DD MMMM YYYY' }}
        icons={{
          point: <TriangleIcon size="lg" className="text-slate-700! text-shadow" />,
        }}
        classNames={{
          slider: 'frosted ',
          sliderContainer: 'rounded-none',
          trackActive: 'top-0 h-2 bg-imos-blue/70',
          scaleMark: 'bg-imos-blue',
        }}
        onChange={handleSelect}
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
          renderSelectionPanel,
        }}
      />
    </div>
  );
});
