import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { CalendarIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { cn, toISODateString, toUTCDate } from '@/utils';
import { Button } from '../Button';
import { Dropdown, type DropdownOption } from '../Dropdown';
import type { NaiveDateTime } from '../DateSlider';

dayjs.extend(utc);

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
/** 6 weeks × 7 days — enough cells to cover any month with its leading/trailing days. */
const GRID_LENGTH = 42;

/** Month-name token for the month <select> labels, and the day-aria format. */
const DEFAULT_MONTH_FORMAT = 'MMMM';
const DEFAULT_DAY_FORMAT = 'DD MMM YYYY';
/** 0–11 — used to build the month <select> options. */
const MONTH_INDEXES = Array.from({ length: 12 }, (_, m) => m);
/** Half-width (years) of the selectable window when a bound is omitted — i.e. "all dates". */
const UNBOUNDED_YEARS = 100;

/**
 * Per-slot class overrides. Each is merged over the component's default styling
 * with `cn`, so callers can theme any part without losing layout. Structural
 * classes (portal positioning, grid layout) are kept internal and not themeable.
 */
export type DatePickerClassNames = {
  /** Root wrapper around the trigger. */
  root?: string;
  /** Calendar icon trigger button. */
  trigger?: string;
  /** Floating popover container. */
  popover?: string;
  /** Header row (month label + nav buttons). */
  header?: string;
  /** Previous/next month buttons. */
  navButton?: string;
  /** Month `<select>` in the header. */
  monthSelect?: string;
  /** Year `<select>` in the header. */
  yearSelect?: string;
  /** Weekday header cell. */
  weekday?: string;
  /** Base day cell. */
  day?: string;
  /** Day belonging to an adjacent month. */
  dayOutsideMonth?: string;
  /** Currently selected day. */
  daySelected?: string;
  /** Out-of-range (disabled) day. */
  dayDisabled?: string;
};

const DEFAULTS = {
  trigger: 'p-1 hover:bg-white/30 rounded',
  popover: 'frosted-glass rounded-lg border border-imos-black/70 p-2 w-64 text-imos-black',
  header: 'mb-2',
  navButton: 'p-1 hover:bg-white/30 rounded disabled:opacity-40 disabled:cursor-not-allowed',
  select:
    'bg-transparent text-imos-black text-sm font-semibold rounded px-1 py-0.5 cursor-pointer hover:bg-white/30 focus-visible:outline focus-visible:outline-offset-1',
  weekday: 'text-center text-[10px] font-semibold uppercase tracking-wide text-imos-black/60',
  day: 'h-8 rounded text-sm transition-colors hover:bg-white/30 focus-visible:outline focus-visible:outline-offset-1',
  dayOutsideMonth: 'text-imos-black/35',
  daySelected: 'bg-imos-blue/60 font-semibold hover:bg-imos-blue/60',
  dayDisabled: 'opacity-30 cursor-not-allowed hover:bg-transparent',
} as const;

/** Contiguous range mode — every day within `[min, max]` is selectable. */
type RangeAvailabilityProps = {
  /** Earliest selectable date (naive, timezone-free, inclusive). */
  min: NaiveDateTime;
  /** Latest selectable date (naive, timezone-free, inclusive). */
  max: NaiveDateTime;
  dateList?: never;
};

/** Explicit list mode — only the dates in `dateList` are selectable. */
type ListAvailabilityProps = {
  /** The only selectable dates (naive, timezone-free). Bounds are derived from the list. */
  dateList: NaiveDateTime[];
  min?: never;
  max?: never;
};

/** Unconstrained mode — pass nothing and every date is selectable. */
type UnconstrainedAvailabilityProps = {
  min?: never;
  max?: never;
  dateList?: never;
};

export type DatePickerProps = {
  /** Currently selected date (naive, timezone-free). */
  value: NaiveDateTime;
  /** Called with the chosen date (naive, timezone-free, midnight). */
  onChange: (date: NaiveDateTime) => void;
  /** Which side of the trigger the popover opens toward. Defaults to `'top'`. */
  placement?: 'top' | 'bottom';
  /** Custom trigger content (defaults to a calendar icon). */
  icon?: ReactNode;
  /** Accessible label for the trigger button. */
  triggerAriaLabel?: string;
  /** dayjs token for the month `<select>` option labels. Defaults to `'MMMM'`. */
  monthFormat?: string;
  /** Per-slot class overrides. */
  classNames?: DatePickerClassNames;
  /** Shorthand for `classNames.root`. */
  className?: string;
} & (RangeAvailabilityProps | ListAvailabilityProps | UnconstrainedAvailabilityProps);

/** Build the 42-cell grid (UTC) for the month containing `viewMonth`. */
function buildMonthGrid(viewMonth: Dayjs): Dayjs[] {
  const startOfMonth = viewMonth.startOf('month');
  const gridStart = startOfMonth.subtract(startOfMonth.day(), 'day');
  return Array.from({ length: GRID_LENGTH }, (_, i) => gridStart.add(i, 'day'));
}

/**
 * Normalized selectable-date model shared by both modes (contiguous `[min, max]`
 * range, or an explicit `dateList`). `minDay`/`maxDay` are the overall bounds
 * (used for navigation limits); the predicates decide what's actually pickable.
 */
type Availability = {
  minDay: Dayjs;
  maxDay: Dayjs;
  isDayAvailable: (day: Dayjs) => boolean;
  isMonthAvailable: (year: number, month: number) => boolean;
  isYearAvailable: (year: number) => boolean;
  /** Nearest selectable month strictly after `month`, or `null` if none. */
  nextAvailableMonth: (month: Dayjs) => Dayjs | null;
  /** Nearest selectable month strictly before `month`, or `null` if none. */
  prevAvailableMonth: (month: Dayjs) => Dayjs | null;
};

function buildAvailability(input: {
  min?: Date;
  max?: Date;
  dateList?: Date[];
  fallback: Dayjs;
}): Availability {
  // List mode — only the supplied dates are pickable; bounds come from the list.
  if (input.dateList) {
    const daySet = new Set<string>();
    const monthSet = new Set<string>();
    const yearSet = new Set<number>();
    const monthStartByKey = new Map<string, Dayjs>();
    let lo: Dayjs | null = null;
    let hi: Dayjs | null = null;
    for (const date of input.dateList) {
      const day = dayjs.utc(date).startOf('day');
      daySet.add(day.format('YYYY-MM-DD'));
      monthSet.add(`${day.year()}-${day.month()}`);
      yearSet.add(day.year());
      monthStartByKey.set(`${day.year()}-${day.month()}`, day.startOf('month'));
      if (!lo || day.isBefore(lo)) lo = day;
      if (!hi || day.isAfter(hi)) hi = day;
    }
    const minDay = lo ?? input.fallback;
    const maxDay = hi ?? input.fallback;
    // Ascending, unique list of the months that actually hold a date.
    const monthStarts = [...monthStartByKey.values()].sort((a, b) => a.valueOf() - b.valueOf());
    return {
      minDay,
      maxDay,
      isDayAvailable: day => daySet.has(day.format('YYYY-MM-DD')),
      isMonthAvailable: (year, month) => monthSet.has(`${year}-${month}`),
      isYearAvailable: year => yearSet.has(year),
      nextAvailableMonth: month => monthStarts.find(ms => ms.isAfter(month, 'month')) ?? null,
      prevAvailableMonth: month => {
        // monthStarts is ascending — scan from the end for the last one before `month`.
        for (let i = monthStarts.length - 1; i >= 0; i--) {
          if (monthStarts[i].isBefore(month, 'month')) return monthStarts[i];
        }
        return null;
      },
    };
  }

  // Range mode — every day within the contiguous bounds is pickable. An omitted
  // bound opens out to a wide window around `fallback`, so passing neither
  // `min` nor `max` effectively makes every date selectable.
  const minDay = (
    input.min ? dayjs.utc(input.min) : input.fallback.subtract(UNBOUNDED_YEARS, 'year')
  ).startOf('day');
  const maxDay = (
    input.max ? dayjs.utc(input.max) : input.fallback.add(UNBOUNDED_YEARS, 'year')
  ).startOf('day');
  const minMonth = minDay.startOf('month');
  const maxMonth = maxDay.startOf('month');
  return {
    minDay,
    maxDay,
    isDayAvailable: day => !day.isBefore(minDay, 'day') && !day.isAfter(maxDay, 'day'),
    isMonthAvailable: (year, month) =>
      !(
        year < minDay.year() ||
        (year === minDay.year() && month < minDay.month()) ||
        year > maxDay.year() ||
        (year === maxDay.year() && month > maxDay.month())
      ),
    isYearAvailable: year => year >= minDay.year() && year <= maxDay.year(),
    nextAvailableMonth: month => {
      const candidate = month.add(1, 'month').startOf('month');
      if (candidate.isBefore(minMonth, 'month')) return minMonth;
      return candidate.isAfter(maxMonth, 'month') ? null : candidate;
    },
    prevAvailableMonth: month => {
      const candidate = month.subtract(1, 'month').startOf('month');
      if (candidate.isAfter(maxMonth, 'month')) return maxMonth;
      return candidate.isBefore(minMonth, 'month') ? null : candidate;
    },
  };
}

type HeaderSelectProps = {
  options: DropdownOption[];
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
};

/**
 * Frosted month/year selector built on the shared Dropdown. Rendered inline (no
 * portal) so its menu lives inside the DatePicker popover — clicks within it
 * then count as "inside" and don't trip the popover's outside-click close.
 */
function HeaderSelect({ options, value, onChange, ariaLabel, className }: HeaderSelectProps) {
  const selected = options.find(option => option.value === value);
  return (
    <Dropdown
      options={options}
      value={value}
      onChange={next => onChange(Number(next))}
      position="auto"
      maxHeight="200px"
      showSelectedCheck={false}
      dropdownClassName="bg-white/90 backdrop-blur-md shadow-lg border border-imos-black/70 rounded-md overflow-hidden z-50 min-w-[80px] w-fit"
      optionClassName="text-sm text-imos-black hover:bg-imos-black/10"
      selectedOptionClassName="bg-imos-blue/40 font-semibold"
      renderTrigger={({ toggle, isOpen }) => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          className={cn(DEFAULTS.select, 'gap-1', className)}
        >
          {selected?.label}
          <ChevronDownIcon className="w-3 h-3 text-imos-black" />
        </Button>
      )}
    />
  );
}

/**
 * Month-grid date picker. Operates on naive (timezone-free) date strings — see
 * the DateSlider package's README § Timezone model for the same convention.
 * Selectable dates come from
 * a contiguous `[min, max]` range, an explicit `dateList` (only those dates are
 * pickable, with empty months/years disabled), or — when none is passed — every
 * date. Passing both `min`/`max` and `dateList` throws. Styling is fully
 * themeable via `classNames` / `className` while structural classes (portal
 * positioning, grid layout) stay internal. The popover is portaled to
 * `document.body` so an ancestor's `overflow-hidden` can't clip it. Defaults
 * match the DateSlider bar's frosted look.
 */
export function DatePicker({
  value,
  min,
  max,
  dateList,
  onChange,
  placement = 'top',
  icon,
  triggerAriaLabel = 'Open date picker',
  monthFormat = DEFAULT_MONTH_FORMAT,
  classNames,
  className,
}: DatePickerProps) {
  if (dateList && (min || max)) {
    throw new Error(
      'DatePicker: pass either `min`/`max` (range) or `dateList` (explicit list), not both.',
    );
  }

  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<Dayjs>(() =>
    dayjs.utc(toUTCDate(value)).startOf('month'),
  );
  const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number } | null>(
    null,
  );

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedDay = dayjs.utc(toUTCDate(value)).startOf('day');
  const availability = useMemo(
    () =>
      buildAvailability({
        min: min ? toUTCDate(min) : undefined,
        max: max ? toUTCDate(max) : undefined,
        dateList: dateList?.map(toUTCDate),
        fallback: selectedDay,
      }),
    // selectedDay is derived from `value`; tracking value keeps the fallback fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [min, max, dateList, value],
  );
  const {
    minDay,
    maxDay,
    isDayAvailable,
    isMonthAvailable,
    isYearAvailable,
    nextAvailableMonth,
    prevAvailableMonth,
  } = availability;
  const minMonth = minDay.startOf('month');
  const maxMonth = maxDay.startOf('month');

  const positionPopover = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = rect.left + rect.width / 2;
    setCoords(
      placement === 'bottom'
        ? { left, top: rect.bottom + 8 }
        : { left, bottom: window.innerHeight - rect.top + 8 },
    );
  }, [placement]);

  const open = useCallback(() => {
    setViewMonth(dayjs.utc(toUTCDate(value)).startOf('month'));
    positionPopover();
    setIsOpen(true);
  }, [value, positionPopover]);

  const close = useCallback(() => setIsOpen(false), []);

  // Keep the popover anchored to the trigger while open.
  useLayoutEffect(() => {
    if (!isOpen) return;
    positionPopover();
    window.addEventListener('resize', positionPopover);
    return () => window.removeEventListener('resize', positionPopover);
  }, [isOpen, positionPopover]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, close]);

  const days = buildMonthGrid(viewMonth);
  // Nearest non-empty months — the arrows jump to these, skipping any gaps.
  const prevMonth = prevAvailableMonth(viewMonth);
  const nextMonth = nextAvailableMonth(viewMonth);

  // Clamp a candidate month into the selectable [minMonth, maxMonth] range so
  // changing the year can't land on an out-of-range month.
  const clampMonth = (d: Dayjs) =>
    d.isBefore(minMonth, 'month') ? minMonth : d.isAfter(maxMonth, 'month') ? maxMonth : d;

  const monthOptions: DropdownOption[] = MONTH_INDEXES.map(m => ({
    value: m,
    label: dayjs.utc().month(m).format(monthFormat),
    disabled: !isMonthAvailable(viewMonth.year(), m),
  }));
  const yearOptions: DropdownOption[] = Array.from(
    { length: maxMonth.year() - minMonth.year() + 1 },
    (_, i) => {
      const year = minMonth.year() + i;
      return { value: year, label: year, disabled: !isYearAvailable(year) };
    },
  );

  const handleSelect = (day: Dayjs) => {
    onChange(toISODateString(day.startOf('day').toDate()));
    close();
  };

  return (
    <div className={cn('inline-flex', classNames?.root, className)}>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        onClick={() => (isOpen ? close() : open())}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={triggerAriaLabel}
        className={cn(DEFAULTS.trigger, classNames?.trigger)}
      >
        {icon ?? <CalendarIcon className="w-4 h-4 text-imos-black" />}
      </Button>

      {isOpen &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Date picker"
            style={{ left: coords.left, top: coords.top, bottom: coords.bottom }}
            className={cn(
              'fixed z-50 -translate-x-1/2 select-none',
              DEFAULTS.popover,
              classNames?.popover,
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between',
                DEFAULTS.header,
                classNames?.header,
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => prevMonth && setViewMonth(prevMonth)}
                disabled={!prevMonth}
                className={cn(DEFAULTS.navButton, classNames?.navButton)}
                aria-label="Previous month"
              >
                <ChevronLeftIcon className="w-4 h-4 text-imos-black" />
              </Button>
              <div className="flex items-center gap-1">
                <HeaderSelect
                  options={monthOptions}
                  value={viewMonth.month()}
                  onChange={m => setViewMonth(prev => clampMonth(prev.month(m)))}
                  ariaLabel="Select month"
                  className={classNames?.monthSelect}
                />
                <HeaderSelect
                  options={yearOptions}
                  value={viewMonth.year()}
                  onChange={y => setViewMonth(prev => clampMonth(prev.year(y)))}
                  ariaLabel="Select year"
                  className={classNames?.yearSelect}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => nextMonth && setViewMonth(nextMonth)}
                disabled={!nextMonth}
                className={cn(DEFAULTS.navButton, classNames?.navButton)}
                aria-label="Next month"
              >
                <ChevronRightIcon className="w-4 h-4 text-imos-black" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-0.5 mb-1">
              {WEEKDAYS.map(weekday => (
                <span key={weekday} className={cn(DEFAULTS.weekday, classNames?.weekday)}>
                  {weekday}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {days.map(day => {
                const unavailable = !isDayAvailable(day);
                const isSelected = day.isSame(selectedDay, 'day');
                const isCurrentMonth = day.month() === viewMonth.month();
                return (
                  <button
                    key={day.valueOf()}
                    type="button"
                    disabled={unavailable}
                    onClick={() => handleSelect(day)}
                    aria-pressed={isSelected}
                    aria-label={day.format(DEFAULT_DAY_FORMAT)}
                    className={cn(
                      DEFAULTS.day,
                      classNames?.day,
                      !isCurrentMonth && cn(DEFAULTS.dayOutsideMonth, classNames?.dayOutsideMonth),
                      unavailable && cn(DEFAULTS.dayDisabled, classNames?.dayDisabled),
                      isSelected && cn(DEFAULTS.daySelected, classNames?.daySelected),
                    )}
                  >
                    {day.date()}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
