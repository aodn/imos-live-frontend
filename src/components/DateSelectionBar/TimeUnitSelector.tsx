import { type RefObject } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { Button } from '../Button';
import { Dropdown, type DropdownOption } from '../Dropdown';
import {
  useDateSliderState,
  type DateSliderStore,
  type SliderExposedMethod,
  type TimeUnit,
} from '../DateSlider';

const ALLOWED_TIME_UNITS: readonly TimeUnit[] = ['day', 'month'];

type TimeUnitSelectorProps = {
  /** Store the slider publishes its live time unit / range validity to. */
  store: DateSliderStore;
  /** Slider's imperative handle — used to commit a time unit change. */
  sliderRef: RefObject<SliderExposedMethod | null>;
};

/**
 * The right cap of the DateSelectionBar: a dropdown + prev/next steppers for the
 * slider's time unit. Rendered as a sibling of the slider; reads the active unit
 * and month validity from the slider's {@link DateSliderStore} and commits
 * changes through the imperative handle (which resets scroll + re-centres).
 */
export function TimeUnitSelector({ store, sliderRef }: TimeUnitSelectorProps) {
  const { timeUnit, isMonthValid } = useDateSliderState(store);

  const index = Math.max(0, ALLOWED_TIME_UNITS.indexOf(timeUnit));
  const currentUnit = ALLOWED_TIME_UNITS[index];
  const isPrevDisabled = index === 0;
  const nextUnit = ALLOWED_TIME_UNITS[index + 1];
  const isNextDisabled = !nextUnit || (nextUnit === 'month' && !isMonthValid);

  const selectTimeUnit = (unit: TimeUnit) => sliderRef.current?.setTimeUnit(unit);

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
        onClick={() => nextUnit && selectTimeUnit(nextUnit)}
        disabled={isNextDisabled}
        className="hover:bg-blue-50 rounded disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next time unit"
      >
        <ChevronRightIcon className="w-4 h-4 text-imos-black rotate-90" />
      </Button>
    </div>
  );
}
