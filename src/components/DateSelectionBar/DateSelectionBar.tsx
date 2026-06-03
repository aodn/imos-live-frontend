import { TriangleIcon } from '../Icons';
import { clearJumpToDate, setDate, useMapUIStore } from '@/store';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useDateSliderDates, useHasInitialQueryParam } from '@/hooks';
import {
  DateSlider,
  type SliderExposedMethod,
  type PointValue,
  type SelectionResult,
  customDateLabelRenderer,
  customSelectionPanelRenderer,
} from '../DateSlider';
import { cn, toISODateString } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { metaDataManifestQueryOptions } from '@/api';
import { PRODUCT } from '@/constants';
import { useShallow } from 'zustand/shallow';

type DateSelectionBarProps = { className?: string };

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
        icons={{
          point: <TriangleIcon size="lg" className="text-slate-700! text-shadow" />,
        }}
        classNames={{
          slider: 'frosted',
          trackActive: 'bg-white/30',
          track: 'bg-white/10',
          scaleMark: 'bg-imos-grey',
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
          renderSelectionPanel: customSelectionPanelRenderer,
        }}
      />
    </div>
  );
});
