import { TriangleIcon } from '../Icons';
import { clearJumpToDate, setDate, useMapUIStore } from '@/store';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useDateSliderDates, useHasInitialQueryParam } from '@/hooks';
import type {
  DateLabelRenderProps,
  TimeUnitSelectionRenderProps,
  TimeUnit,
  DateFormat,
  DateFormatFn,
} from '../DateSlider';
import {
  DateSlider,
  type SliderExposedMethod,
  type PointValue,
  type SelectionResult,
  type SelectionPanelRenderProps,
} from '../DateSlider';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Dropdown, type DropdownOption } from '../Dropdown';
import { cn, toISODateString } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { metaDataManifestQueryOptions } from '@/api';
import { PRODUCT } from '@/constants';
import { useShallow } from 'zustand/shallow';

type DateSelectionBarProps = { className?: string };

function renderSelectionPanel({ toNextDate, toPrevDate, dateLabel }: SelectionPanelRenderProps) {
  return (
    <div className="hidden md:flex items-center gap-1 frosted rounded-l-lg px-2 py-1.5 w-40 shrink-0 overflow-hidden border-r border-imos-black/70">
      <button
        onClick={toPrevDate}
        className="p-1 hover:bg-white/30 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Previous date"
      >
        <ChevronLeftIcon className="w-4 h-4 text-imos-black" />
      </button>
      <span className="text-sm font-semibold text-imos-black flex-1 text-center whitespace-nowrap">
        {dateLabel}
      </span>
      <button
        onClick={toNextDate}
        className="p-1 hover:bg-white/30 rounded transition-colors shrink-0 cursor-pointer"
        aria-label="Next date"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-black" />
      </button>
    </div>
  );
}

const ALLOWED_TIME_UNITS: readonly TimeUnit[] = ['day', 'month'];

function renderTimeUnitSelection({
  timeUnit,
  selectTimeUnit,
  isMonthValid,
}: TimeUnitSelectionRenderProps) {
  const index = Math.max(0, ALLOWED_TIME_UNITS.indexOf(timeUnit));
  const currentUnit = ALLOWED_TIME_UNITS[index];
  const isPrevDisabled = index === 0;
  const nextUnit = ALLOWED_TIME_UNITS[index + 1];
  const isNextDisabled = !nextUnit || (nextUnit === 'month' && !isMonthValid);

  const timeUnitOptions: DropdownOption[] = ALLOWED_TIME_UNITS.map(unit => ({
    value: unit,
    label: unit,
    disabled: unit === 'month' && !isMonthValid,
  }));

  return (
    <div className="flex flex-col items-center justify-between frosted rounded-r-lg px-3 border-l border-imos-black/70 w-20 shrink-0">
      <Dropdown
        options={timeUnitOptions}
        value={currentUnit}
        onChange={value => selectTimeUnit(value as TimeUnit)}
        position="top"
        closeOnMouseLeave
        maxHeight="160px"
        dropdownClassName="frosted-glass border-imos-black/70 rounded-lg overflow-hidden min-w-20 mb-0 left-1/2 -translate-x-1/2"
        showSelectedCheck={false}
        optionClassName="justify-center uppercase text-xs font-bold tracking-wide text-imos-black bg-transparent hover:bg-white/30"
        selectedOptionClassName="bg-white/40"
        renderTrigger={({ open, toggle, isOpen }) => (
          <button
            type="button"
            onMouseEnter={open}
            onClick={toggle}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="text-xs font-bold text-imos-black uppercase tracking-wide cursor-pointer select-none"
          >
            {currentUnit}
          </button>
        )}
      />
      <button
        onClick={() => selectTimeUnit(ALLOWED_TIME_UNITS[index - 1])}
        disabled={isPrevDisabled}
        className="hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        aria-label="Previous time unit"
      >
        <ChevronLeftIcon className="w-4 h-4 text-imos-black rotate-90" />
      </button>

      <button
        onClick={() => selectTimeUnit(nextUnit)}
        disabled={isNextDisabled}
        className=" hover:bg-blue-50 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
        aria-label="Next time unit"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-black rotate-90" />
      </button>
    </div>
  );
}

function renderDateLabel({ label }: DateLabelRenderProps) {
  return (
    <span className="frosted  text-sm text-imos-black px-3 py-1 rounded whitespace-nowrap shadow-lg">
      {label}
    </span>
  );
}

function isFirstOfYear(date: Date) {
  return date.getUTCMonth() === 0 && date.getUTCDate() === 1;
}

function isFirstOfMonth(date: Date) {
  return date.getUTCDate() === 1;
}

const dateFormat: DateFormat = {
  label: () => 'DD MMM YYYY',
  scale: (({ date, unit }) => {
    if (unit === 'day' && isFirstOfMonth(date)) return 'MMM YYYY';
    if (unit === 'month' && isFirstOfYear(date)) return 'YYYY';
    return '';
  }) satisfies DateFormatFn,
};

export const DateSelectionBar = memo(function DateSelectionBar({
  className,
}: DateSelectionBarProps) {
  const { date, startDate, endDate } = useDateSliderDates(); //date in DateSlider is expected to be UTC only.
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
        dateFormat={dateFormat}
        icons={{
          point: <TriangleIcon size="lg" className="text-slate-700! text-shadow" />,
        }}
        classNames={{
          slider: 'frosted ',
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
        behavior={{ scrollable: true, handleLabelDisabled: false }}
        renderProps={{
          renderDateLabel,
          renderSelectionPanel,
          renderTimeUnitSelection,
        }}
      />
    </div>
  );
});
