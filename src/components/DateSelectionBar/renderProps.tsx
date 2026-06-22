import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../Button';
import { Dropdown, type DropdownOption } from '../Dropdown';
import type {
  DateFormat,
  DateFormatFn,
  DateLabelRenderProps,
  SelectionPanelRenderProps,
  TimeUnit,
  TimeUnitSelectionRenderProps,
} from '../DateSlider';

const ALLOWED_TIME_UNITS: readonly TimeUnit[] = ['day', 'month'];

/** Rendered width (px) of the SelectionPanel — shared with the collapse logic in DateSelectionBar. */
export const SELECTION_PANEL_WIDTH = 160;

export function renderSelectionPanel({
  toNextDate,
  toPrevDate,
  dateLabel,
}: SelectionPanelRenderProps) {
  return (
    <div
      style={{ width: SELECTION_PANEL_WIDTH }}
      className="hidden md:flex items-center gap-1 frosted rounded-l-lg px-2 py-1.5 shrink-0 overflow-hidden border-r border-imos-black/70"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={toPrevDate}
        className="p-1 hover:bg-white/30 rounded"
        aria-label="Previous date"
      >
        <ChevronLeftIcon className="w-4 h-4 text-imos-black" />
      </Button>
      <span className="text-sm font-semibold text-imos-black flex-1 text-center whitespace-nowrap">
        {dateLabel}
      </span>
      <Button
        variant="ghost"
        size="icon"
        onClick={toNextDate}
        className="p-1 hover:bg-white/30 rounded"
        aria-label="Next date"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-black" />
      </Button>
    </div>
  );
}

export function renderTimeUnitSelection({
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
    <div className="flex flex-col items-center justify-between frosted px-3 border-l border-r border-imos-black/70 w-20 shrink-0">
      <Dropdown
        options={timeUnitOptions}
        value={currentUnit}
        onChange={value => selectTimeUnit(value as TimeUnit)}
        position="top"
        closeOnMouseLeave
        maxHeight="160px"
        dropdownClassName="frosted-glass border-imos-black/70 overflow-hidden min-w-20 mb-0 left-1/2 -translate-x-1/2"
        showSelectedCheck={false}
        optionClassName="justify-center uppercase text-xs font-bold tracking-wide text-imos-black bg-transparent hover:bg-white/30"
        selectedOptionClassName="bg-white/40"
        renderTrigger={({ open, toggle, isOpen }) => (
          <Button
            variant="ghost"
            size="icon"
            onMouseEnter={open}
            onClick={toggle}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className="text-xs font-bold text-imos-black uppercase tracking-wide select-none"
          >
            {currentUnit}
          </Button>
        )}
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => selectTimeUnit(ALLOWED_TIME_UNITS[index - 1])}
        disabled={isPrevDisabled}
        className="hover:bg-blue-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous time unit"
      >
        <ChevronLeftIcon className="w-4 h-4 text-imos-black rotate-90" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => selectTimeUnit(nextUnit)}
        disabled={isNextDisabled}
        className="hover:bg-blue-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next time unit"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-black rotate-90" />
      </Button>
    </div>
  );
}

export function renderDateLabel({ label }: DateLabelRenderProps) {
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

export const dateFormat: DateFormat = {
  label: () => 'DD MMM YYYY',
  scale: (({ date, unit }) => {
    if (unit === 'day' && isFirstOfMonth(date)) return 'MMM YYYY';
    if (unit === 'month' && isFirstOfYear(date)) return 'YYYY';
    return '';
  }) satisfies DateFormatFn,
};
