import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
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

export function renderSelectionPanel({
  toNextDate,
  toPrevDate,
  dateLabel,
}: SelectionPanelRenderProps) {
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
